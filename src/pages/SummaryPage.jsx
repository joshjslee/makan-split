import { useNavigate } from 'react-router-dom';
import { Layout, Header, Main, BottomBar, Button, Card } from '../components/ui';
import { useSplit } from '../context/SplitContext';
import { Check, Edit2 } from 'lucide-react';

export default function SummaryPage() {
    const navigate = useNavigate();
    const { items, members, totalAmount, calculateMemberShare, taxSettings } = useSplit();

    const formatPrice = (price) => {
        return `RM ${Number(price).toFixed(2)}`;
    };

    const calculateItemBreakdown = (price) => {
        const svc = price * (taxSettings.serviceCharge / 100);
        const taxable = price + svc;
        const tax = taxable * (taxSettings.serviceTax / 100);
        return {
            base: price,
            svc,
            tax,
            total: price + svc + tax
        };
    };

    return (
        <Layout>
            <Header title="Settlement Complete! 🎉" showBack />

            <Main className="flex flex-col gap-6 pb-24">
                {/* Success Message */}
                <div className="text-center py-4">
                    <div className="w-16 h-16 bg-status-paid/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Check className="w-8 h-8 text-status-paid" />
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-1">All Set!</h2>
                    <p className="text-surface-muted">
                        Review the assignment and share with your friends.
                    </p>
                </div>

                {/* Overview Card */}
                <Card>
                    <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                        Today's Split
                    </h3>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-surface-muted">{members.length} people joined</p>
                            <p className="text-2xl font-bold text-gray-900">{formatPrice(totalAmount)}</p>
                        </div>
                        <div className="w-12 h-12 bg-brand-blue-light rounded-xl flex items-center justify-center text-2xl">
                            🍽️
                        </div>
                    </div>
                </Card>

                {/* Assignment Breakdown */}
                <Card>
                    <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-4">
                        Member Assignment Result
                    </h3>
                    <p className="text-xs text-surface-muted mb-4">
                        Review the assigned members for each item.
                    </p>

                    <div className="space-y-4">
                        {items.map((item) => {
                            const breakdown = calculateItemBreakdown(item.price);
                            return (
                                <div key={item.id} className="border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-lg">{item.icon}</span>
                                            <span className="font-medium text-gray-900">{item.name}</span>
                                        </div>
                                        <div className="text-right">
                                            <span className="font-semibold text-gray-900 block">{formatPrice(breakdown.total)}</span>
                                            <div className="text-[10px] text-gray-400 mt-0.5">
                                                {formatPrice(breakdown.base)} + {breakdown.svc.toFixed(2)} SVC + {breakdown.tax.toFixed(2)} Tax
                                            </div>
                                        </div>
                                    </div>
                                    {item.assignedMembers.length > 0 ? (
                                        <div className="flex flex-wrap gap-1">
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
                                        <span className="text-xs text-status-pending">No members assigned</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Card>

                {/* Per Member Breakdown */}
                <Card>
                    <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-4">
                        Each Person Pays
                    </h3>
                    <div className="space-y-3">
                        {members.map((member) => {
                            const share = calculateMemberShare(member.id);
                            return (
                                <div key={member.id} className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">👤</span>
                                        <span className="font-medium text-gray-900">{member.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-semibold text-brand-green block">{formatPrice(share.total)}</span>
                                        <div className="text-[10px] text-gray-400 mt-0.5">
                                            {formatPrice(share.subtotal)} + {share.serviceCharge.toFixed(2)} SVC + {share.serviceTax.toFixed(2)} Tax
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </Card>
            </Main>

            <BottomBar className="flex flex-col gap-2">
                <Button onClick={() => navigate('/share')}>
                    Confirm & Share
                </Button>
                <Button variant="secondary" onClick={() => navigate('/assign')} leftIcon={<Edit2 className="w-5 h-5" />}>
                    Edit
                </Button>
            </BottomBar>
        </Layout>
    );
}
