
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Input from '../components/Input';
import Button from '../components/Button';

const ForgotPasswordPage: React.FC = () => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setSubmitted(true);
        }, 1000);
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-lg w-full max-w-md fade-in">
                <h1 className="text-3xl font-bold text-center mb-1 text-white text-glow">
                    PASSKEY RECOVERY
                </h1>
                <p className="text-center text-gray-400 mb-6">Initiate recovery protocol</p>

                {submitted ? (
                    <div className="bg-green-500/20 border border-green-500 text-green-300 text-center p-3 rounded-md mb-4 text-sm">
                        <p className="font-semibold">Transmission Sent</p>
                        <p>If a profile for {email} exists, recovery instructions have been dispatched.</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            type="email"
                            placeholder="Your Secure Email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            icon={<i className="fa-solid fa-envelope"></i>}
                        />
                        <Button type="submit" isLoading={isLoading}>
                            Send Instructions
                        </Button>
                    </form>
                )}

                <p className="text-center text-sm text-gray-500 mt-6">
                    Recall your passkey? <Link to="/login" className="font-semibold text-[var(--accent-pink)] hover:underline hover:text-glow">Authorize</Link>
                </p>
            </div>
        </div>
    );
};

export default ForgotPasswordPage;
        