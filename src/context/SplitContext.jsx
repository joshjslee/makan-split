import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const SplitContext = createContext(null);

// V4 Schema Mappings
// We need to map our app's simple state 'members' and 'items' to the DB tables
// splits -> participants, items, item_assignments

export function SplitProvider({ children }) {
    // Current Split ID (if we are working on one)
    const [currentSplitId, setCurrentSplitId] = useState(localStorage.getItem('current_split_id') || null);

    // App State (In-memory cache of what we are editing)
    const [members, setMembers] = useState([]);
    const [items, setItems] = useState([]);
    const [taxSettings, setTaxSettingsState] = useState({ serviceCharge: 10, serviceTax: 6 });
    const [paymentSettings, setPaymentSettingsState] = useState({ duitNowId: '', bankName: '', accountNumber: '' });
    const [loading, setLoading] = useState(false);

    // Payment tracking state
    const [paymentStatus, setPaymentStatus] = useState(() => {
        const saved = localStorage.getItem('payment_status');
        return saved ? JSON.parse(saved) : {};
    });

    // Reminder settings state
    const [reminderSettings, setReminderSettingsState] = useState(() => {
        const saved = localStorage.getItem('reminder_settings');
        return saved ? JSON.parse(saved) : { frequency: 'every-2-days', time: 'morning', autoSend: false };
    });

    // Sync currentSplitId to LocalStorage so we don't lose it on refresh
    useEffect(() => {
        if (currentSplitId) localStorage.setItem('current_split_id', currentSplitId);
        else {
            localStorage.removeItem('current_split_id');
            // Reset local state if no split ID
            setMembers([]);
            setItems([]);
        }
    }, [currentSplitId]);

    // FETCH: Load full split data from Supabase
    const fetchSplitData = useCallback(async (splitId) => {
        if (!splitId) return;
        setLoading(true);
        try {
            // 1. Fetch Split Metadata (Tax, etc)
            const { data: split, error: splitError } = await supabase
                .from('splits')
                .select('*')
                .eq('id', splitId)
                .single();

            if (splitError) throw splitError;
            if (split) {
                setTaxSettings({
                    serviceCharge: split.service_charge || 0,
                    serviceTax: split.tax_amount || 0 // Note: DB field is tax_amount (value) vs tax percentage. For now assuming simplified logic or we map it. 
                    // Actually, V4 schema has tax_amount (numeric). 
                    // To keep frontend simple for now, we might stick to %, but let's assume we just store defaults.
                });
            }

            // 2. Fetch Participants
            const { data: participants, error: partError } = await supabase
                .from('participants')
                .select('*')
                .eq('split_id', splitId);

            if (partError) throw partError;

            // Map DB participants to frontend shape
            // Frontend: { id, name, avatar... }
            const mappedMembers = participants.map(p => ({
                id: p.id,
                name: p.name,
                avatar: '😊', // DB doesn't have avatar yet for guests
                isSettled: p.is_settled
            }));
            setMembers(mappedMembers);

            // 3. Fetch Items & Assignments
            const { data: dbItems, error: itemError } = await supabase
                .from('items')
                .select(`
                    *,
                    item_assignments (participant_id)
                `)
                .eq('split_id', splitId);

            if (itemError) throw itemError;

            // Map DB items to frontend shape
            const mappedItems = dbItems.map(i => ({
                id: i.id,
                name: i.name,
                price: parseFloat(i.price),
                quantity: i.quantity,
                assignedMembers: i.item_assignments.map(ia => ia.participant_id)
            }));
            setItems(mappedItems);

        } catch (error) {
            console.error('Error fetching split:', error);
            alert('Failed to load split data');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial Load
    useEffect(() => {
        if (currentSplitId) {
            fetchSplitData(currentSplitId);
        }
    }, [currentSplitId, fetchSplitData]);


    // CREATE: Start a new split
    const createNewSplit = useCallback(async (title = "New Receipt") => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('splits')
                .insert({
                    title,
                    currency: 'KRW',
                    tax_amount: 0,
                    service_charge: 0
                })
                .select()
                .single();

            if (error) throw error;

            setCurrentSplitId(data.id);
            setMembers([]);
            setItems([]);
            return data.id;
        } catch (e) {
            console.error(e);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // ACTION: Add Member (Directly to DB)
    const addMember = useCallback(async (name) => {
        if (!currentSplitId) {
            // Use local state if no split created yet (or auto-create split?)
            // For now, let's auto-create if missing, or just warn.
            // Better: update local state, and Save later. 
            // BUT user wants "Real DB". Let's force DB interaction or use a "Draft" mode.
            // To be safe: Update Local State, and if currentSplitId exists, sync to DB.
            console.warn("No active split ID to save member to.");
            return;
        }

        const newMemberName = name || `Participant ${members.length + 1}`;

        // Optimistic UI Update
        const tempId = `temp-${Date.now()}`;
        setMembers(prev => [...prev, { id: tempId, name: newMemberName, avatar: '😊' }]);

        try {
            const { data, error } = await supabase
                .from('participants')
                .insert({
                    split_id: currentSplitId,
                    name: newMemberName
                })
                .select()
                .single();

            if (error) throw error;

            // Replace temp ID with real DB ID
            setMembers(prev => prev.map(m => m.id === tempId ? { ...m, id: data.id } : m));
            return data.id;
        } catch (e) {
            console.error(e);
        }
    }, [currentSplitId, members.length]);

    // ACTION: Add Member with Details (Alias/Updated)
    const addMemberWithDetails = useCallback(async (details) => {
        if (!currentSplitId) return;

        const name = typeof details === 'string' ? details : details.name;
        const avatar = details.avatar || '😊';
        const phone = details.phone || '';

        try {
            const { data, error } = await supabase
                .from('participants')
                .insert({
                    split_id: currentSplitId,
                    name,
                    phone,
                    avatar
                })
                .select()
                .single();

            if (error) throw error;

            setMembers(prev => [...prev, {
                id: data.id,
                name: data.name,
                avatar: data.avatar || '😊',
                phone: data.phone,
                isSettled: data.is_settled
            }]);
            return data.id;
        } catch (e) {
            console.error(e);
        }
    }, [currentSplitId]);

    // ACTION: Update Member
    const updateMember = useCallback(async (memberId, updates) => {
        if (!currentSplitId) return;

        // Optimistic
        setMembers(prev => prev.map(m => m.id === memberId ? { ...m, ...updates } : m));

        try {
            const { error } = await supabase
                .from('participants')
                .update({
                    name: updates.name,
                    phone: updates.phone,
                    avatar: updates.avatar
                })
                .eq('id', memberId);

            if (error) throw error;
        } catch (e) {
            console.error(e);
        }
    }, [currentSplitId]);

    // ACTION: Add "Me" Member
    const addMeMember = useCallback(async () => {
        if (!currentSplitId) return;
        // Check if exists
        if (members.some(m => m.name === 'Me')) return;

        await addMember('Me');
    }, [currentSplitId, members, addMember]);


    // ACTION: Bulk Add (e.g. from OCR)
    const bulkAddItems = useCallback(async (itemsList) => {
        if (!currentSplitId || !itemsList.length) return;

        setLoading(true);
        try {
            const dbReadyItems = itemsList.map(item => ({
                split_id: currentSplitId,
                name: item.name,
                price: item.price,
                quantity: item.quantity || 1
            }));

            const { data, error } = await supabase
                .from('items')
                .insert(dbReadyItems)
                .select();

            if (error) throw error;

            // Update local state with real DB IDs
            const savedItems = data.map(dbItem => ({
                id: dbItem.id,
                name: dbItem.name,
                price: parseFloat(dbItem.price),
                quantity: dbItem.quantity,
                assignedMembers: []
            }));

            setItems(prev => [...prev, ...savedItems]);
            return true;
        } catch (e) {
            console.error("Bulk Add Error:", e);
            return false;
        } finally {
            setLoading(false);
        }
    }, [currentSplitId]);

    // ACTION: Remove Item (with rollback on failure)
    const removeItem = useCallback(async (itemId) => {
        if (!currentSplitId) return;

        // Store item for potential rollback
        const itemToRemove = items.find(i => i.id === itemId);
        if (!itemToRemove) return;

        // Optimistic UI update
        setItems(prev => prev.filter(i => i.id !== itemId));

        try {
            const { error } = await supabase
                .from('items')
                .delete()
                .eq('id', itemId);

            if (error) throw error;
        } catch (e) {
            console.error('Failed to delete item, rolling back:', e);
            // Rollback: restore the item
            setItems(prev => [...prev, itemToRemove]);
        }
    }, [currentSplitId, items]);

    // ACTION: Assign Member to Item (with rollback on failure)
    const assignMemberToItem = useCallback(async (itemId, memberId) => {
        if (!currentSplitId) return;
        if (String(itemId).startsWith('temp') || String(memberId).startsWith('temp')) return; // Wait for sync

        // Check if currently assigned
        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const isAssigned = item.assignedMembers.includes(memberId);
        const previousAssignedMembers = [...item.assignedMembers]; // Store for rollback

        // Optimistic UI Update
        setItems(prev => prev.map(i => {
            if (i.id === itemId) {
                return {
                    ...i,
                    assignedMembers: isAssigned
                        ? i.assignedMembers.filter(id => id !== memberId)
                        : [...i.assignedMembers, memberId]
                };
            }
            return i;
        }));

        try {
            if (isAssigned) {
                // Remove
                const { error } = await supabase
                    .from('item_assignments')
                    .delete()
                    .match({ item_id: itemId, participant_id: memberId });
                if (error) throw error;
            } else {
                // Add
                const { error } = await supabase
                    .from('item_assignments')
                    .insert({ item_id: itemId, participant_id: memberId });
                if (error) throw error;
            }
        } catch (e) {
            console.error('Failed to update assignment, rolling back:', e);
            // Rollback: restore previous assigned members
            setItems(prev => prev.map(i => {
                if (i.id === itemId) {
                    return { ...i, assignedMembers: previousAssignedMembers };
                }
                return i;
            }));
        }
    }, [currentSplitId, items]);

    // ACTION: Assign All to Item
    const assignAllToItem = useCallback(async (itemId) => {
        if (!currentSplitId || !members.length) return;

        // UI Update
        const memberIds = members.map(m => m.id);
        setItems(prev => prev.map(i => i.id === itemId ? { ...i, assignedMembers: memberIds } : i));

        try {
            // First clear existing
            await supabase
                .from('item_assignments')
                .delete()
                .eq('item_id', itemId);

            // Bulk Insert
            const inserts = memberIds.map(mid => ({
                item_id: itemId,
                participant_id: mid
            }));

            await supabase
                .from('item_assignments')
                .insert(inserts);
        } catch (e) {
            console.error(e);
        }
    }, [currentSplitId, members]);

    // Calculate Totals (Same logic as before, just using state)
    const calculateMemberShare = useCallback((memberId) => {
        const subtotal = items.reduce((total, item) => {
            if (item.assignedMembers.includes(memberId)) {
                return total + item.price / item.assignedMembers.length;
            }
            return total;
        }, 0);

        const serviceCharge = subtotal * (taxSettings.serviceCharge / 100);
        const taxableAmount = subtotal + serviceCharge;
        const serviceTax = taxableAmount * (taxSettings.serviceTax / 100);

        return {
            subtotal,
            serviceCharge,
            serviceTax,
            total: subtotal + serviceCharge + serviceTax
        };
    }, [items, taxSettings]);

    const setTaxSettings = useCallback(async (newSettings) => {
        if (!currentSplitId) {
            setTaxSettingsState(newSettings);
            return;
        }

        try {
            const { error } = await supabase
                .from('splits')
                .update({
                    service_charge: newSettings.serviceCharge,
                    tax_amount: newSettings.serviceTax // Storing % in tax_amount for now to match UI logic
                })
                .eq('id', currentSplitId);

            if (error) throw error;
            setTaxSettingsState(newSettings);
        } catch (e) {
            console.error(e);
        }
    }, [currentSplitId]);

    const setPaymentSettings = useCallback((settings) => {
        setPaymentSettingsState(settings);
        localStorage.setItem('payment_settings', JSON.stringify(settings));
    }, []);

    // Mark member as paid
    const markAsPaid = useCallback((memberId) => {
        setPaymentStatus(prev => {
            const updated = { ...prev, [memberId]: 'paid' };
            localStorage.setItem('payment_status', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Mark member as pending
    const markAsPending = useCallback((memberId) => {
        setPaymentStatus(prev => {
            const updated = { ...prev, [memberId]: 'pending' };
            localStorage.setItem('payment_status', JSON.stringify(updated));
            return updated;
        });
    }, []);

    // Set reminder settings
    const setReminderSettings = useCallback((settings) => {
        setReminderSettingsState(settings);
        localStorage.setItem('reminder_settings', JSON.stringify(settings));
    }, []);

    // Aggregates - Calculate using same formula as calculateMemberShare for consistency
    const subtotalAmount = items.reduce((sum, item) => sum + item.price, 0);
    const serviceChargeAmount = subtotalAmount * (taxSettings.serviceCharge / 100);
    const taxableAmount = subtotalAmount + serviceChargeAmount;
    const serviceTaxAmount = taxableAmount * (taxSettings.serviceTax / 100);
    const grandTotal = subtotalAmount + serviceChargeAmount + serviceTaxAmount;

    const resetSession = useCallback(() => {
        setCurrentSplitId(null);
        setMembers([]);
        setItems([]);
    }, []);

    const loadMockReceipt = useCallback(() => { }, []);

    const value = {
        // State
        currentSplitId,
        members,
        items,
        taxSettings,
        paymentSettings,
        paymentStatus,
        reminderSettings,
        subtotalAmount,
        totalAmount: grandTotal,
        loading,

        // Actions
        createNewSplit,
        addMember,
        addMeMember,
        addMemberWithDetails,
        updateMember,
        addItem: (item) => bulkAddItems([item]),
        bulkAddItems,
        removeItem,
        assignMemberToItem,
        assignAllToItem,
        calculateMemberShare,
        setTaxSettings,
        setPaymentSettings,
        markAsPaid,
        markAsPending,
        setReminderSettings,

        // Helpers
        setItems,
        setMembers,
        setCurrentSplitId,
        resetSession,
        loadMockReceipt
    };

    return <SplitContext.Provider value={value}>{children}</SplitContext.Provider>;
}

export function useSplit() {
    const context = useContext(SplitContext);
    if (!context) {
        throw new Error('useSplit must be used within a SplitProvider');
    }
    return context;
}
