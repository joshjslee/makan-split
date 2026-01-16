import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Header, Main, BottomBar, Button, Card, Modal } from '../components/ui';
import { useSplit } from '../context/SplitContext';
import { MessageCircle, Copy, Check, ExternalLink, QrCode, Phone, Settings, AlertCircle } from 'lucide-react';

export default function SharePage() {
    const navigate = useNavigate();

    const { members, calculateMemberShare, totalAmount, paymentSettings, setPaymentSettings } = useSplit();
    const [copiedId, setCopiedId] = useState(null);
    const [sentIds, setSentIds] = useState(new Set());
    const [showSettingsModal, setShowSettingsModal] = useState(false);

    // Local state for modal inputs
    const [localDuitNow, setLocalDuitNow] = useState(paymentSettings?.duitNowId || '');
    const [localBank, setLocalBank] = useState(paymentSettings?.bankName || '');
    const [localAccount, setLocalAccount] = useState(paymentSettings?.accountNumber || '');

    const formatPrice = (price) => {
        return `RM ${Number(price).toFixed(2)}`;
    };

    // Clean phone number for WhatsApp (remove spaces, dashes, etc.)
    const cleanPhoneNumber = (phone) => {
        if (!phone) return '';
        // Remove all non-numeric characters except +
        let cleaned = phone.replace(/[^\d+]/g, '');
        // If starts with 0, replace with 60 (Malaysia code)
        if (cleaned.startsWith('0')) {
            cleaned = '60' + cleaned.substring(1);
        }
        // If doesn't start with +, add it
        if (!cleaned.startsWith('+') && !cleaned.startsWith('60')) {
            cleaned = '60' + cleaned;
        }
        return cleaned.replace('+', '');
    };

    // Generate payment deep link (mock or real if we had a real payment schema)
    // For now, we'll append the DuitNow ID/Bank Info to the URL or message
    const generatePaymentLink = (memberId, amount) => {
        const amountInRM = Number(amount).toFixed(2);
        const recipient = paymentSettings?.duitNowId || 'user-not-set';
        // Note: This is still a mock schema since there's no standard open DuitNow deep link without a specific bank app.
        // But let's make it look consistent.
        // Ideally we might just put the DuitNow ID in the message text.
        return `https://pay.makan-split.app/pay?to=${recipient}&amount=${amountInRM}&ref=${memberId}`;
    };

    // Generate WhatsApp message
    const generateWhatsAppMessage = (member) => {
        const shareObj = calculateMemberShare(member.id);
        const share = shareObj.total;

        const paymentLink = generatePaymentLink(member.id, share);

        let msg = `Hey ${member.name}! 🍜\n\nWe just had lunch together and your share is ${formatPrice(share)}.\n\n`;

        if (paymentSettings?.duitNowId) {
            msg += `Please DuitNow/Transfer to:\nID: ${paymentSettings.duitNowId}\n`;
            if (paymentSettings.bankName) msg += `Bank: ${paymentSettings.bankName}\n`;
            if (paymentSettings.accountNumber) msg += `Acc: ${paymentSettings.accountNumber}\n`;
        } else {
            msg += `Pay here: ${paymentLink}\n`;
        }

        msg += `\nThank you! 🙏`;
        return msg;
    };

    // Open WhatsApp with pre-filled message
    const sendWhatsApp = (member) => {
        const message = encodeURIComponent(generateWhatsAppMessage(member));
        const phone = cleanPhoneNumber(member.phone);
        const url = phone
            ? `https://wa.me/${phone}?text=${message}`
            : `https://wa.me/?text=${message}`;
        window.open(url, '_blank');
        setSentIds(prev => new Set([...prev, member.id]));
    };

    // Send to all members
    const sendToAll = () => {
        members.forEach((member, index) => {
            // Stagger the window opens to avoid popup blocking
            setTimeout(() => {
                sendWhatsApp(member);
            }, index * 500);
        });
    };

    // Copy payment link
    const copyLink = (memberId) => {
        const share = calculateMemberShare(memberId).total;
        const link = generatePaymentLink(memberId, share);
        navigator.clipboard.writeText(link);
        setCopiedId(memberId);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <Layout>
            <Header
                title="Share & Pay 💸"
                showBack
                rightAction={
                    <button
                        onClick={() => {
                            setLocalDuitNow(paymentSettings?.duitNowId || '');
                            setLocalBank(paymentSettings?.bankName || '');
                            setLocalAccount(paymentSettings?.accountNumber || '');
                            setShowSettingsModal(true);
                        }}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <Settings className="w-5 h-5 text-gray-600" />
                    </button>
                }
            />

            <Main className="flex flex-col gap-6 pb-24">
                {/* Payment Settings Alert if incomplete */}
                {!paymentSettings?.duitNowId && (
                    <Card className="bg-orange-50 border border-orange-200">
                        <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-semibold text-orange-800">Payment Info Missing</p>
                                <p className="text-xs text-orange-600 mb-2">Add your DuitNow/Bank details so friends know where to pay.</p>
                                <Button size="sm" variant="outline" onClick={() => setShowSettingsModal(true)}>
                                    Add Details
                                </Button>
                            </div>
                        </div>
                    </Card>
                )}

                {/* Overview */}
                <Card className="bg-gradient-to-br from-[var(--color-brand-green)] to-[var(--color-brand-green-dark)] text-white">
                    <h3 className="text-sm font-medium opacity-80 mb-1">Total to Collect</h3>
                    <p className="text-3xl font-bold">{formatPrice(totalAmount)}</p>
                    <p className="text-sm opacity-80 mt-1">{members.length} people</p>
                    {paymentSettings?.duitNowId && (
                        <div className="mt-3 pt-3 border-t border-white/20 text-xs opacity-90">
                            Collecting to: {paymentSettings.duitNowId} ({paymentSettings.bankName})
                        </div>
                    )}
                </Card>

                {/* Per Member Share Cards */}
                <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                        Send to Each Person
                    </h3>

                    {members.length === 0 ? (
                        <Card className="text-center py-8">
                            <p className="text-gray-500">No members yet. Go back and add some!</p>
                        </Card>
                    ) : (
                        members.map((member) => {
                            const share = calculateMemberShare(member.id).total;
                            const isCopied = copiedId === member.id;
                            const isSent = sentIds.has(member.id);
                            const hasPhone = !!member.phone;

                            return (
                                <Card key={member.id}>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-[var(--color-brand-blue-light)] rounded-full flex items-center justify-center text-xl">
                                                {member.avatar || '👤'}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{member.name}</p>
                                                {member.phone ? (
                                                    <p className="text-xs text-gray-500 flex items-center gap-1">
                                                        <Phone className="w-3 h-3" />
                                                        {member.phone}
                                                    </p>
                                                ) : (
                                                    <p className="text-sm text-gray-400">Owes you</p>
                                                )}
                                            </div>
                                        </div>
                                        <p className="text-xl font-bold text-[var(--color-brand-green)]">
                                            {formatPrice(share)}
                                        </p>
                                    </div>

                                    {/* Payment Link Preview */}
                                    <div className="bg-gray-50 rounded-xl p-3 mb-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <QrCode className="w-4 h-4 text-gray-400" />
                                            <span className="text-xs text-gray-400">DuitNow Payment Link</span>
                                        </div>
                                        <p className="text-xs text-gray-600 truncate">
                                            {generatePaymentLink(member.id, share)}
                                        </p>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant={isSent ? 'secondary' : 'primary'}
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => sendWhatsApp(member)}
                                            leftIcon={isSent ? <Check className="w-4 h-4" /> : <MessageCircle className="w-4 h-4" />}
                                        >
                                            {isSent ? 'Sent!' : hasPhone ? 'WhatsApp' : 'Share'}
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            className="flex-1"
                                            onClick={() => copyLink(member.id)}
                                            leftIcon={isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        >
                                            {isCopied ? 'Copied!' : 'Copy Link'}
                                        </Button>
                                    </div>
                                </Card>
                            );
                        })
                    )}
                </div>

                {/* Bulk Send */}
                {members.length > 0 && (
                    <Card
                        className="bg-[var(--color-brand-blue-light)] border-2 border-[var(--color-brand-blue)]/20 cursor-pointer hover:bg-[var(--color-brand-blue)]/10 transition-colors"
                        onClick={sendToAll}
                    >
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[var(--color-brand-blue)]/10 rounded-xl flex items-center justify-center">
                                <ExternalLink className="w-6 h-6 text-[var(--color-brand-blue)]" />
                            </div>
                            <div className="flex-1">
                                <p className="font-semibold text-gray-900">Send to All at Once</p>
                                <p className="text-sm text-gray-500">Open WhatsApp for each person</p>
                            </div>
                        </div>
                    </Card>
                )}
            </Main>

            <BottomBar>
                <Button onClick={() => navigate('/tracking')}>
                    Track Payments →
                </Button>
            </BottomBar>

            {/* Payment Settings Modal */}
            <Modal
                isOpen={showSettingsModal}
                onClose={() => setShowSettingsModal(false)}
                title="Payment Settings"
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-500">
                        Your friends will see these details when you share the payment link.
                    </p>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">DuitNow ID / Phone</label>
                        <input
                            className="w-full px-3 py-2 border rounded-xl"
                            placeholder="e.g. +60123456789"
                            value={localDuitNow}
                            onChange={(e) => setLocalDuitNow(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bank Name (Optional)</label>
                        <input
                            className="w-full px-3 py-2 border rounded-xl"
                            placeholder="e.g. Maybank"
                            value={localBank}
                            onChange={(e) => setLocalBank(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Account Number (Optional)</label>
                        <input
                            className="w-full px-3 py-2 border rounded-xl"
                            placeholder="e.g. 1122334455"
                            value={localAccount}
                            onChange={(e) => setLocalAccount(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={() => {
                            setPaymentSettings({
                                duitNowId: localDuitNow,
                                bankName: localBank,
                                accountNumber: localAccount
                            });
                            setShowSettingsModal(false);
                        }}
                    >
                        Save Details
                    </Button>
                </div>
            </Modal>
        </Layout>
    );
}
