import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header, Main, BottomBar, Button, Card, Modal, ConfirmDialog } from '../components/ui';
import { useSplit } from '../context/SplitContext';
import { ChevronRight, Plus, Trash2, Users, UserPlus, Edit2, Check, X, Settings, ChevronLeft } from 'lucide-react';

export default function AssignPage() {
    const navigate = useNavigate();
    const {
        items,
        members,
        totalAmount,
        assignMemberToItem,
        assignAllToItem,
        removeItem,
        addMeMember,
        updateMember,
        taxSettings,
        setTaxSettings,
        bulkAddItems,
    } = useSplit();

    const [selectedItemId, setSelectedItemId] = useState(null);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [showExitDialog, setShowExitDialog] = useState(false);
    const [showTaxModal, setShowTaxModal] = useState(false);
    const [localTaxSettings, setLocalTaxSettings] = useState(taxSettings || { serviceCharge: 10, serviceTax: 6 });

    // Member Editing State
    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editPhone, setEditPhone] = useState('');

    const selectedItem = items.find((item) => item.id === selectedItemId);

    const handleMemberToggle = (memberId) => {
        if (selectedItemId) {
            assignMemberToItem(selectedItemId, memberId);
        }
    };

    const handleAddAll = (itemId) => {
        assignAllToItem(itemId);
    };

    const openMemberModal = (itemId) => {
        setSelectedItemId(itemId);
        setShowMemberModal(true);
    };

    const startEditing = (member) => {
        setEditingMemberId(member.id);
        setEditName(member.name);
        setEditPhone(member.phone || '');
    };

    const saveMember = () => {
        if (editingMemberId && editName.trim()) {
            updateMember(editingMemberId, { name: editName, phone: editPhone });
            setEditingMemberId(null);
        }
    };

    const cancelEditing = () => {
        setEditingMemberId(null);
    };

    const formatPrice = (price) => {
        // Since we are moving to standard currency units (decimal numbers), 
        // we'll format based on the assumption that price is the full unit (e.g. 10.50)
        return `RM ${Number(price).toFixed(2)}`;
    };

    // Calculate tax breakdown for individual amount
    const calculateBreakdown = (amount) => {
        const svc = amount * (taxSettings.serviceCharge / 100);
        const taxable = amount + svc;
        const tax = taxable * (taxSettings.serviceTax / 100);
        return {
            base: amount,
            svc,
            tax,
            total: amount + svc + tax
        };
    };

    // Calculate grand total breakdown
    const subtotalBreakdown = calculateBreakdown(items.reduce((sum, item) => sum + item.price, 0));
    // Note: totalAmount from context matches subtotalBreakdown.total

    return (
        <Layout>
            <Header
                title="Assign Items"
                leftAction={
                    <button
                        onClick={() => navigate('/setup')}
                        className="p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        <ChevronLeft className="w-6 h-6 text-gray-700" />
                    </button>
                }
                rightAction={
                    <button
                        onClick={() => setShowExitDialog(true)}
                        className="text-sm text-surface-muted"
                    >
                        Cancel
                    </button>
                }
            />

            <Main className="flex flex-col gap-4 pb-24">
                {/* Total Header */}
                <div className="text-center py-2 relative">
                    <p className="text-sm text-surface-muted">Grand Total (incl. Tax)</p>
                    <p className="text-2xl font-bold text-gray-900">{formatPrice(totalAmount)}</p>

                    <button
                        onClick={() => {
                            setLocalTaxSettings(taxSettings);
                            setShowTaxModal(true);
                        }}
                        className="absolute right-4 top-2 p-2 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        <Settings className="w-4 h-4 text-gray-600" />
                    </button>

                    <div className="text-xs text-gray-400 mt-1">
                        {formatPrice(subtotalBreakdown.base)} + {subtotalBreakdown.svc.toFixed(2)} SVC + {subtotalBreakdown.tax.toFixed(2)} Tax
                    </div>
                </div>

                {/* Item List */}
                {items.map((item) => {
                    const itemBreakdown = calculateBreakdown(item.price);

                    return (
                        <Card key={item.id} className="relative">
                            <div className="flex items-start gap-3">
                                {/* Icon */}
                                <div className="w-10 h-10 bg-brand-blue-light rounded-xl flex items-center justify-center text-xl">
                                    {item.icon || '🍽️'}
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h3 className="font-semibold text-gray-900">{item.name}</h3>
                                            <div className="flex flex-col">
                                                <p className="text-brand-green font-medium">{formatPrice(itemBreakdown.total)}</p>
                                                <p className="text-[10px] text-gray-400">
                                                    {formatPrice(itemBreakdown.base)} + {itemBreakdown.svc.toFixed(2)} SVC + {itemBreakdown.tax.toFixed(2)} Tax
                                                </p>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openMemberModal(item.id)}
                                            rightIcon={<ChevronRight className="w-4 h-4" />}
                                        >
                                            Detail
                                        </Button>
                                    </div>

                                    {/* Assigned Members */}
                                    {item.assignedMembers.length > 0 ? (
                                        <div className="flex flex-wrap gap-1 mt-2">
                                            {item.assignedMembers.map((memberId) => {
                                                const member = members.find((m) => m.id === memberId);
                                                return (
                                                    <span key={memberId} className="chip-member text-xs">
                                                        {member?.name}
                                                    </span>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-xs text-surface-muted mt-2">
                                            Tap Detail to assign members
                                        </p>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 mt-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleAddAll(item.id)}
                                        >
                                            Add All
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openMemberModal(item.id)}
                                            leftIcon={<Plus className="w-4 h-4" />}
                                        >
                                            Add Member
                                        </Button>
                                    </div>

                                    {/* Delete */}
                                    <button
                                        onClick={() => removeItem(item.id)}
                                        className="text-xs text-status-error mt-2 flex items-center gap-1 hover:underline"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                        Delete Item
                                    </button>
                                </div>
                            </div>
                        </Card>
                    )
                })}
            </Main>

            <BottomBar>
                <Button onClick={() => navigate('/summary')}>
                    Check Result
                </Button>
            </BottomBar>

            {/* Member Selection Modal */}
            <Modal
                isOpen={showMemberModal}
                onClose={() => setShowMemberModal(false)}
                title="Add Member"
            >
                <div className="flex flex-col gap-2">
                    <Button
                        variant="primary"
                        onClick={() => {
                            if (selectedItemId) handleAddAll(selectedItemId);
                            setShowMemberModal(false);
                        }}
                    >
                        <Users className="w-5 h-5 mr-2" />
                        Add All
                    </Button>

                    <Button
                        variant="secondary"
                        onClick={() => {
                            addMeMember();
                            // Don't close modal, just add me so user can select me immediately if they want
                        }}
                    >
                        <UserPlus className="w-5 h-5 mr-2" />
                        Add "Me"
                    </Button>

                    <div className="h-px bg-gray-100 my-2" />

                    {members.map((member) => {
                        const isAssigned = selectedItem?.assignedMembers.includes(member.id);
                        const isEditing = editingMemberId === member.id;

                        if (isEditing) {
                            return (
                                <div key={member.id} className="flex gap-2 items-center p-1">
                                    <input
                                        className="flex-1 text-sm border rounded px-2 py-1"
                                        value={editName}
                                        onChange={(e) => setEditName(e.target.value)}
                                        placeholder="Name"
                                        autoFocus
                                    />
                                    <button onClick={saveMember} className="p-1 text-brand-green">
                                        <Check className="w-5 h-5" />
                                    </button>
                                    <button onClick={cancelEditing} className="p-1 text-gray-400">
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>
                            );
                        }

                        return (
                            <div key={member.id} className="flex gap-2">
                                <Button
                                    className="flex-1 justify-between"
                                    variant={isAssigned ? 'primary' : 'secondary'}
                                    onClick={() => handleMemberToggle(member.id)}
                                >
                                    <span>{member.name}</span>
                                    {isAssigned && <Check className="w-4 h-4 ml-2" />}
                                </Button>
                                <button
                                    onClick={() => startEditing(member)}
                                    className="p-2 text-gray-400 hover:text-gray-600"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </Modal>

            {/* Exit Confirmation */}
            <ConfirmDialog
                isOpen={showExitDialog}
                onClose={() => setShowExitDialog(false)}
                onConfirm={() => navigate('/')}
                title="Leave this screen?"
                message="Your current assignment progress will be lost."
                confirmText="Leave"
                cancelText="Stay"
            />

            {/* Tax Settings Modal */}
            <Modal
                isOpen={showTaxModal}
                onClose={() => setShowTaxModal(false)}
                title="Tax Settings"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Charge (%)
                        </label>
                        <div className="flex gap-2">
                            {[0, 5, 10].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setLocalTaxSettings(prev => ({ ...prev, serviceCharge: val }))}
                                    className={`px-3 py-1 rounded-md text-sm border ${localTaxSettings.serviceCharge === val ? 'bg-brand-green text-white border-brand-green' : 'border-gray-300 text-gray-700'}`}
                                >
                                    {val}%
                                </button>
                            ))}
                            <input
                                type="number"
                                value={localTaxSettings.serviceCharge}
                                onChange={(e) => setLocalTaxSettings(prev => ({ ...prev, serviceCharge: Number(e.target.value) }))}
                                className="w-20 px-2 py-1 border rounded-md text-sm"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Service Tax (SST) (%)
                        </label>
                        <div className="flex gap-2">
                            {[0, 6, 8].map(val => (
                                <button
                                    key={val}
                                    onClick={() => setLocalTaxSettings(prev => ({ ...prev, serviceTax: val }))}
                                    className={`px-3 py-1 rounded-md text-sm border ${localTaxSettings.serviceTax === val ? 'bg-brand-green text-white border-brand-green' : 'border-gray-300 text-gray-700'}`}
                                >
                                    {val}%
                                </button>
                            ))}
                            <input
                                type="number"
                                value={localTaxSettings.serviceTax}
                                onChange={(e) => setLocalTaxSettings(prev => ({ ...prev, serviceTax: Number(e.target.value) }))}
                                className="w-20 px-2 py-1 border rounded-md text-sm"
                            />
                        </div>
                    </div>

                    <Button
                        onClick={() => {
                            setTaxSettings(localTaxSettings);
                            setShowTaxModal(false);
                        }}
                    >
                        Save Settings
                    </Button>
                </div>
            </Modal>
        </Layout>
    );
}
