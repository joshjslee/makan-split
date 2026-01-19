import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header, Main, BottomBar, Button, Card, Input, Modal } from '../components/ui';
import { useSplit } from '../context/SplitContext';
import { Minus, Plus, Camera, Edit3, User, Phone } from 'lucide-react';

// Random avatar emojis for variety
const AVATAR_EMOJIS = ['😊', '😎', '🤩', '🥳', '😄', '🤗', '😋', '🙂', '😁', '🤓'];

export default function SetupPage() {
    const navigate = useNavigate();
    const { loadMockReceipt, resetSession, addMemberWithDetails, createNewSplit, bulkAddItems, loading } = useSplit();
    const [memberCount, setMemberCount] = useState(3);
    const [showUploadModal, setShowUploadModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false); // Local loading state for button

    // Member details (local state before submitting)
    const [memberDetails, setMemberDetails] = useState([]);

    // Check if "Me" is already set to show visual feedback
    const hasMe = memberDetails.some(m => m.name === 'Me');

    // Initialize member details when count changes
    useEffect(() => {
        setMemberDetails(prev => {
            const newDetails = [];
            for (let i = 0; i < memberCount; i++) {
                if (prev[i]) {
                    newDetails.push(prev[i]);
                } else {
                    newDetails.push({
                        name: '',
                        phone: '',
                        avatar: AVATAR_EMOJIS[i % AVATAR_EMOJIS.length],
                    });
                }
            }
            return newDetails;
        });
    }, [memberCount]);

    const handleCountChange = (delta) => {
        const newCount = Math.max(2, Math.min(10, memberCount + delta));
        setMemberCount(newCount);
    };

    const updateMemberDetail = (index, field, value) => {
        setMemberDetails(prev => {
            const updated = [...prev];
            updated[index] = { ...updated[index], [field]: value };
            return updated;
        });
    };

    const setMemberAsMe = (index) => {
        setMemberDetails(prev => {
            const updated = [...prev];
            // Reset any existing "Me" to default if needed, or just allow one Me
            // Ideally we just overwrite this slot
            updated[index] = {
                name: 'Me',
                phone: '', // Optional for me
                avatar: '😎',
                isMe: true
            };
            return updated;
        });
    };

    const handleProceed = async (mode) => {
        setIsSaving(true);
        try {
            // Validate and prepare member details
            const validatedMembers = memberDetails.map((detail, index) => {
                // Use placeholder name if empty
                const name = detail.name.trim() || `Participant ${index + 1}`;
                return {
                    ...detail,
                    name,
                    phone: detail.phone?.trim() || ''
                };
            });

            // Check for duplicate names
            const names = validatedMembers.map(m => m.name);
            const duplicates = names.filter((name, index) => names.indexOf(name) !== index);
            if (duplicates.length > 0) {
                alert(`Duplicate names found: ${[...new Set(duplicates)].join(', ')}. Please use unique names.`);
                setIsSaving(false);
                return;
            }

            // First create a new split session to get splitId
            await createNewSplit("New Receipt");

            // Add all members sequentially to ensure they are in DB
            for (const detail of validatedMembers) {
                await addMemberWithDetails(detail);
            }

            if (mode === 'scan') {
                navigate('/scan');
            } else {
                // Direct Input mode: Add default items
                const defaultItems = [
                    { name: 'Nasi Lemak', price: 15.00, quantity: 1 },
                    { name: 'Teh Tarik', price: 5.00, quantity: 1 },
                ];
                await bulkAddItems(defaultItems);
                navigate('/assign');
            }
        } catch (e) {
            console.error(e);
            alert("Failed to initialize members. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];
            // Navigate to scan page with the file
            loadMockReceipt(); // Still needed for mock data placeholder
            navigate('/scan', { state: { file } });
        }
    };

    const triggerFileInput = () => {
        document.getElementById('setup-file-input').click();
    };

    return (
        <Layout>
            <Header title="New Split" showBack />

            <Main className="flex flex-col gap-6 pb-32">
                {/* Hidden File Input */}
                <input
                    id="setup-file-input"
                    type="file"
                    accept="image/*"
                    capture="environment"
                    className="hidden"
                    onChange={handleFileChange}
                />

                {/* Member Count Section */}
                <Card>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                        How many people? 👥
                    </h2>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-4 mb-6">
                        <button
                            onClick={() => handleCountChange(-1)}
                            disabled={memberCount <= 2}
                            className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Minus className="w-5 h-5 text-gray-700" />
                        </button>
                        <span className="text-3xl font-bold text-gray-900 w-12 text-center">
                            {memberCount}
                        </span>
                        <button
                            onClick={() => handleCountChange(1)}
                            disabled={memberCount >= 10}
                            className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                            <Plus className="w-5 h-5 text-gray-700" />
                        </button>
                    </div>
                </Card>

                {/* Member Details Section */}
                <Card>
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Who's joining? ✏️
                    </h2>
                    <p className="text-sm text-gray-500 mb-4">
                        Enter names and phone numbers for WhatsApp sharing
                    </p>

                    <div className="space-y-4">
                        {memberDetails.map((member, index) => (
                            <div key={index} className="flex gap-3 items-start">
                                {/* Avatar */}
                                <div className="flex flex-col gap-1 items-center">
                                    <button
                                        onClick={() => {
                                            const randomEmoji = AVATAR_EMOJIS[Math.floor(Math.random() * AVATAR_EMOJIS.length)];
                                            updateMemberDetail(index, 'avatar', randomEmoji);
                                        }}
                                        className="w-12 h-12 bg-[var(--color-brand-blue-light)] rounded-xl flex items-center justify-center text-2xl hover:scale-105 transition-transform flex-shrink-0"
                                        title="Click to change avatar"
                                    >
                                        {member.avatar}
                                    </button>
                                    {!hasMe && index === 0 && (
                                        <button
                                            onClick={() => setMemberAsMe(index)}
                                            className="text-xs font-bold text-brand-green bg-brand-green/10 px-2 py-1 rounded-full hover:bg-brand-green/20"
                                        >
                                            It's Me
                                        </button>
                                    )}
                                </div>

                                {/* Input Fields */}
                                <div className="flex-1 space-y-2">
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder={`Participant ${index + 1}`}
                                            value={member.name}
                                            onChange={(e) => updateMemberDetail(index, 'name', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] focus:border-transparent placeholder:text-gray-400 text-sm"
                                        />
                                    </div>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        <input
                                            type="tel"
                                            placeholder="+60 12-345 6789"
                                            value={member.phone}
                                            onChange={(e) => updateMemberDetail(index, 'phone', e.target.value)}
                                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-green)] focus:border-transparent placeholder:text-gray-400 text-sm"
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Tip */}
                    <div className="mt-4 p-3 bg-[var(--color-brand-blue-light)] rounded-xl">
                        <p className="text-xs text-[var(--color-brand-blue)]">
                            💡 Tip: Click on the emoji to change avatar. Phone numbers are optional but help with WhatsApp sharing!
                        </p>
                    </div>
                </Card>
            </Main>

            <BottomBar className="flex gap-3">
                <Button
                    variant="secondary"
                    onClick={() => handleProceed('manual')}
                    leftIcon={<Edit3 className="w-5 h-5" />}
                    disabled={isSaving}
                >
                    {isSaving ? 'Saving...' : 'Direct Input'}
                </Button>
                <Button
                    onClick={triggerFileInput}
                    leftIcon={<Camera className="w-5 h-5" />}
                    disabled={isSaving}
                >
                    Scan Receipt
                </Button>
            </BottomBar>
        </Layout>
    );
}
