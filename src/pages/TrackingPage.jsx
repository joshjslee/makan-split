import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header, Main, BottomBar, Button, Card, Modal } from '../components/ui';
import { useSplit } from '../context/SplitContext';
import { Check, Clock, Bell, Settings, Send, MessageCircle } from 'lucide-react';

export default function TrackingPage() {
    const navigate = useNavigate();
    const {
        members,
        paymentStatus,
        calculateMemberShare,
        markAsPaid,
        markAsPending,
        reminderSettings,
        setReminderSettings,
    } = useSplit();

    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [localSettings, setLocalSettings] = useState(reminderSettings);

    const formatPrice = (price) => {
        return `RM ${Number(price).toFixed(2)}`;
    };

    const paidMembers = members.filter((m) => paymentStatus[m.id] === 'paid');
    const pendingMembers = members.filter((m) => paymentStatus[m.id] !== 'paid');

    const togglePaymentStatus = (memberId) => {
        if (paymentStatus[memberId] === 'paid') {
            markAsPending(memberId);
        } else {
            markAsPaid(memberId);
        }
    };

    const sendPoke = (member) => {
        const share = calculateMemberShare(member.id).total;
        const message = encodeURIComponent(
            `Hey ${member.name}! 👋\n\nJust a friendly reminder that you still owe ${formatPrice(share)} from our last meal. 🍜\n\nThank you! 🙏`
        );
        // Clean phone number for WhatsApp
        let phone = '';
        if (member.phone) {
            phone = member.phone.replace(/[^\d+]/g, '');
            if (phone.startsWith('0')) {
                phone = '60' + phone.substring(1);
            }
            phone = phone.replace('+', '');
        }
        const url = phone
            ? `https://wa.me/${phone}?text=${message}`
            : `https://wa.me/?text=${message}`;
        window.open(url, '_blank');
    };

    const saveSettings = () => {
        setReminderSettings(localSettings);
        setShowSettingsModal(false);
    };

    const frequencyOptions = [
        { value: 'daily', label: 'Daily' },
        { value: 'every-2-days', label: 'Every 2 Days' },
        { value: 'every-3-days', label: 'Every 3 Days' },
        { value: 'weekly', label: 'Weekly' },
    ];

    const timeOptions = [
        { value: 'morning', label: 'Morning (9 AM)' },
        { value: 'lunch', label: 'Lunch (12 PM)' },
        { value: 'evening', label: 'Evening (6 PM)' },
    ];

    return (
        <Layout>
            <Header
                title="Payment Tracking"
                showBack
                rightAction={
                    <button
                        onClick={() => setShowSettingsModal(true)}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                }
            />

            <Main className="flex flex-col gap-6 pb-24">
                {/* Status Summary */}
                <div className="flex gap-4">
                    <Card className="flex-1 !p-4 bg-status-paid/10 border-2 border-status-paid/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-status-paid" />
                            <span className="text-sm font-medium text-status-paid">Paid</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{paidMembers.length}</p>
                    </Card>
                    <Card className="flex-1 !p-4 bg-status-pending/10 border-2 border-status-pending/20">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-status-pending" />
                            <span className="text-sm font-medium text-status-pending">Pending</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{pendingMembers.length}</p>
                    </Card>
                </div>

                {/* Pending Members */}
                {pendingMembers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                            Pending Payments
                        </h3>
                        <div className="space-y-3">
                            {pendingMembers.map((member) => {
                                const share = calculateMemberShare(member.id).total;
                                return (
                                    <Card key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[var(--color-status-pending)]/10 rounded-full flex items-center justify-center text-xl">
                                                {member.avatar || '👤'}
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{member.name}</p>
                                                <p className="text-sm text-status-pending font-medium">{formatPrice(share)}</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => sendPoke(member)}
                                                className="p-2 bg-brand-green/10 text-brand-green rounded-lg hover:bg-brand-green/20 transition-colors"
                                                title="Send Reminder"
                                            >
                                                <MessageCircle className="w-5 h-5" />
                                            </button>
                                            <button
                                                onClick={() => togglePaymentStatus(member.id)}
                                                className="p-2 bg-status-paid/10 text-status-paid rounded-lg hover:bg-status-paid/20 transition-colors"
                                                title="Mark as Paid"
                                            >
                                                <Check className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Paid Members */}
                {paidMembers.length > 0 && (
                    <div>
                        <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                            Paid ✓
                        </h3>
                        <div className="space-y-3">
                            {paidMembers.map((member) => {
                                const share = calculateMemberShare(member.id).total;
                                return (
                                    <Card key={member.id} className="flex items-center justify-between opacity-60">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-status-paid/10 rounded-full flex items-center justify-center">
                                                <Check className="w-5 h-5 text-status-paid" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-gray-900">{member.name}</p>
                                                <p className="text-sm text-status-paid font-medium">{formatPrice(share)}</p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => togglePaymentStatus(member.id)}
                                            className="text-xs text-surface-muted hover:underline"
                                        >
                                            Undo
                                        </button>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* All Paid State */}
                {pendingMembers.length === 0 && paidMembers.length > 0 && (
                    <Card className="text-center py-8 bg-status-paid/5">
                        <div className="w-16 h-16 bg-status-paid/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Check className="w-8 h-8 text-status-paid" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">All Paid! 🎉</h3>
                        <p className="text-surface-muted">Everyone has settled their share.</p>
                    </Card>
                )}
            </Main>

            <BottomBar>
                <Button onClick={() => navigate('/')} variant="secondary">
                    Done
                </Button>
            </BottomBar>

            {/* Reminder Settings Modal */}
            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title="Reminder Settings"
            >
                <div className="space-y-6">
                    {/* Frequency */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Bell className="w-4 h-4 inline mr-1" />
                            Reminder Frequency
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {frequencyOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setLocalSettings({ ...localSettings, frequency: opt.value })}
                                    className={`py-2 px-4 rounded-xl text-sm font-medium transition-colors ${localSettings.frequency === opt.value
                                        ? 'bg-brand-green text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Time */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-1" />
                            Send Time
                        </label>
                        <div className="space-y-2">
                            {timeOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    onClick={() => setLocalSettings({ ...localSettings, time: opt.value })}
                                    className={`w-full py-3 px-4 rounded-xl text-left text-sm font-medium transition-colors ${localSettings.time === opt.value
                                        ? 'bg-brand-green text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Auto-send Toggle */}
                    <div className="flex items-center justify-between py-3 border-t border-gray-100">
                        <div>
                            <p className="font-medium text-gray-900">Auto-send Reminders</p>
                            <p className="text-sm text-surface-muted">Automatically send via WhatsApp</p>
                        </div>
                        <button
                            onClick={() => setLocalSettings({ ...localSettings, autoSend: !localSettings.autoSend })}
                            className={`w-12 h-7 rounded-full transition-colors ${localSettings.autoSend ? 'bg-brand-green' : 'bg-gray-300'
                                }`}
                        >
                            <div
                                className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${localSettings.autoSend ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    <Button onClick={saveSettings}>Save Settings</Button>
                </div>
            </Modal>
        </Layout>
    );
}
