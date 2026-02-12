
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import Input from '../components/Input';
import Button from '../components/Button';

const LoginPage: React.FC = () => {
    const [identifier, setIdentifier] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [stayLoggedIn, setStayLoggedIn] = useState(false);
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login({ identifier, password }, stayLoggedIn);
            navigate('/forum');
        } catch (err: any) {
            setError(err.message || 'Failed to log in.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex-1 flex flex-col items-center justify-center p-4">
            <div className="glass-panel p-8 rounded-lg w-full max-w-md fade-in">
                <h1 className="text-4xl font-bold text-center mb-8 text-white text-glow">
                    THW CLUB
                </h1>
                
                {error && <p className="bg-red-500/20 border border-red-500 text-red-300 text-center p-2 rounded-md mb-4 text-sm">{error}</p>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <Input 
                        type="text"
                        placeholder="Username"
                        value={identifier}
                        onChange={(e) => setIdentifier(e.target.value)}
                        required
                        icon={<i className="fa-solid fa-user"></i>}
                    />
                    <div className="relative">
                        <Input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Passkey"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            icon={<i className="fa-solid fa-lock"></i>}
                        />
                        <button 
                            type="button" 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors z-10"
                        >
                            {showPassword ? <i className="fa-solid fa-eye-slash text-sm"></i> : <i className="fa-solid fa-eye text-sm"></i>}
                        </button>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                        <label className="flex items-center text-gray-400 select-none">
                            <input 
                                type="checkbox"
                                checked={stayLoggedIn}
                                onChange={(e) => setStayLoggedIn(e.target.checked)}
                                className="h-4 w-4 bg-transparent border-gray-600 text-[var(--accent-pink)] focus:ring-[var(--accent-pink)] rounded-sm"
                            />
                            <span className="ml-2">Remember me</span>
                        </label>
                        <Link to="/forgot-password" className="text-[var(--accent-pink)] hover:underline hover:text-glow">Passkey Recovery</Link>
                    </div>

                    <Button type="submit" isLoading={isLoading}>
                        Authorize
                    </Button>
                </form>

                <p className="text-center text-sm text-gray-500 mt-6">
                    Don't have account? <Link to="/register" className="font-semibold text-[var(--accent-pink)] hover:underline hover:text-glow">Register</Link>
                </p>
            </div>
        </div>
    );
};

export default LoginPage;
