import { useNavigate } from 'react-router-dom';
import { Layout, Header, Main, BottomBar, Button, Card, CardTitle, CardDescription } from '../components/ui';
import { Plus, Receipt, Clock } from 'lucide-react';
import { useSplit } from '../context/SplitContext';

export default function HomePage() {
    const navigate = useNavigate();
    const { createNewSplit } = useSplit();

    const handleStart = async () => {
        const splitId = await createNewSplit("New Lunch");
        if (splitId) {
            navigate('/setup');
        }
    };

    // Placeholder for history - would come from backend/localStorage
    const recentSplits = [];

    return (
        <Layout>
            <Header title="Makan Split 🍜" />

            <Main className="flex flex-col gap-6">
                {/* Hero Section */}
                <div className="text-center py-8">
                    <div className="w-24 h-24 mx-auto mb-4 bg-brand-blue-light rounded-full flex items-center justify-center">
                        <Receipt className="w-12 h-12 text-brand-blue" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">
                        Split bills easily! 💸
                    </h2>
                    <p className="text-surface-muted">
                        Scan a receipt or enter items manually.
                        <br />
                        Share with friends via WhatsApp.
                    </p>
                </div>

                {/* Quick Actions */}
                <Card className="!p-0 overflow-hidden">
                    <button
                        onClick={handleStart}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-12 h-12 bg-brand-green/10 rounded-xl flex items-center justify-center">
                            <Plus className="w-6 h-6 text-brand-green" />
                        </div>
                        <div className="text-left">
                            <CardTitle>Start New Split</CardTitle>
                            <CardDescription>Scan or enter a receipt</CardDescription>
                        </div>
                    </button>

                    <div className="border-t border-gray-100" />

                    <button
                        onClick={() => navigate('/tracking')}
                        className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors"
                    >
                        <div className="w-12 h-12 bg-status-pending/10 rounded-xl flex items-center justify-center">
                            <Clock className="w-6 h-6 text-status-pending" />
                        </div>
                        <div className="text-left">
                            <CardTitle>Check Pending</CardTitle>
                            <CardDescription>View who hasn't paid yet</CardDescription>
                        </div>
                    </button>
                </Card>

                {/* Recent History */}
                {recentSplits.length > 0 ? (
                    <div>
                        <h3 className="text-sm font-semibold text-surface-muted uppercase tracking-wide mb-3">
                            Recent Splits
                        </h3>
                        {/* History list would go here */}
                    </div>
                ) : (
                    <div className="text-center py-8 text-surface-muted">
                        <p>No recent splits yet.</p>
                        <p className="text-sm">Start your first one! 🎉</p>
                    </div>
                )}
            </Main>

            <BottomBar>
                <Button onClick={handleStart} leftIcon={<Plus className="w-5 h-5" />}>
                    New Split
                </Button>
            </BottomBar>
        </Layout>
    );
}
