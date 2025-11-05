import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ICONS } from '../constants';

const Signup: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [passwordConfirm, setPasswordConfirm] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== passwordConfirm) {
            return setError("As senhas não coincidem.");
        }
        setError('');
        try {
            await auth.signup(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Falha ao criar a conta.');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-text-primary">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg">
                <div className="flex flex-col items-center space-y-2">
                    {ICONS.logo}
                    <h1 className="text-3xl font-bold">Criar Conta</h1>
                </div>
                {error && <p className="text-red-500 text-center">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block mb-2 text-sm font-medium">Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-2 bg-input-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium">Senha</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 bg-input-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                     <div>
                        <label className="block mb-2 text-sm font-medium">Confirmar Senha</label>
                        <input
                            type="password"
                            value={passwordConfirm}
                            onChange={(e) => setPasswordConfirm(e.target.value)}
                            className="w-full px-4 py-2 bg-input-bg border border-border-color rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                            required
                        />
                    </div>
                    <button type="submit" className="w-full px-4 py-2 text-lg font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Cadastrar
                    </button>
                </form>
                <p className="text-center text-sm">
                    Já tem uma conta?{' '}
                    <Link to="/login" className="font-medium text-primary hover:underline">
                        Entrar
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Signup;