
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';

const REGISTRATION_COOLDOWN_SECONDS = 60;

const RegisterPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [inviteCode, setInviteCode] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);
    
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [cooldown, setCooldown] = useState(0);

    const { register } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        let timer: number;
        if (cooldown > 0) {
            timer = window.setTimeout(() => setCooldown(cooldown - 1), 1000);
        }
        return () => window.clearTimeout(timer);
    }, [cooldown]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!agreedToTerms) {
            setError("You must accept the protocol.");
            return;
        }
        setError('');
        setIsLoading(true);
        setCooldown(REGISTRATION_COOLDOWN_SECONDS);

        try {
            await register({ username, email, password, inviteCode });
            navigate('/forum');
        } catch (err: any)
 {
            setError(err.message || 'Registration failed.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-lg w-full max-w-md fade-in">
                <h1 className="text-3xl font-bold text-center mb-6 text-white text-glow">
                    INITIATE ACCOUNT
                </h1>

                {error && <p className="bg-red-500/20 border border-red-500 text-red-300 text-center p-2 rounded-md mb-4 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        type="text"
                        placeholder="Username *"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        icon={<i className="fa-solid fa-user"></i>}
                    />
                    <Input
                        type="email"
                        placeholder="Secure Email *"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        icon={<i className="fa-solid fa-envelope"></i>}
                    />
                    <Input
                        type="password"
                        placeholder="Passkey *"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        icon={<i className="fa-solid fa-lock"></i>}
                    />
                    <Input
                        type="text"
                        placeholder="Invite Code *"
                        value={inviteCode}
                        onChange={(e) => setInviteCode(e.target.value)}
                        required
                        icon={<i className="fa-solid fa-key"></i>}
                    />

                    <div className="h-16 bg-black/30 border border-transparent rounded-md flex items-center justify-center text-gray-500 text-sm border-dashed border-gray-700">
                        [ Security Check Placeholder ]
                    </div>
                    
                    <div className="flex items-center">
                        <input
                            id="terms"
                            type="checkbox"
                            checked={agreedToTerms}
                            onChange={(e) => setAgreedToTerms(e.target.checked)}
                            className="h-4 w-4 bg-transparent border-gray-600 text-[var(--accent-pink)] focus:ring-[var(--accent-pink)] rounded-sm"
                        />
                        <label htmlFor="terms" className="ml-2 block text-sm text-gray-400">
                            I accept the <a href="#" className="text-[var(--accent-pink)] hover:underline">Protocol</a> & <a href="#" className="text-[var(--accent-pink)] hover:underline">Data Policy</a>.
                        </label>
                    </div>

                    <Button type="submit" isLoading={isLoading} disabled={cooldown > 0}>
                        {cooldown > 0 ? `System Cooldown: ${cooldown}s` : 'Register'}
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Already have credentials? <Link to="/login" className="font-semibold text-[var(--accent-pink)] hover:underline hover:text-glow">Authorize</Link>
                </p>
            </div>
        </div>
    );
};

export default RegisterPage;
