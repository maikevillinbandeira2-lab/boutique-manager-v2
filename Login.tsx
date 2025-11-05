import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import { ICONS } from '../constants';

const Login: React.FC = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const auth = useContext(AuthContext);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        try {
            await auth.login(email, password);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Falha ao fazer login.');
        }
    };
    
    const handleGoogleSignIn = async () => {
        try {
            await auth.signInWithGoogle();
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Falha ao fazer login com o Google.');
        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-background text-text-primary">
            <div className="w-full max-w-md p-8 space-y-6 bg-card rounded-xl shadow-lg">
                <div className="flex flex-col items-center space-y-2">
                    {ICONS.logo}
                    <h1 className="text-3xl font-bold">Entrar no BoutiqueManager</h1>
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
                    <button type="submit" className="w-full px-4 py-2 text-lg font-semibold text-white bg-primary rounded-lg hover:opacity-90 transition-opacity">
                        Entrar
                    </button>
                </form>
                 <div className="relative flex items-center justify-center my-6">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border-color"></div>
                    </div>
                    <div className="relative px-2 bg-card text-sm text-text-secondary">ou</div>
                </div>
                <button
                    onClick={handleGoogleSignIn}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-lg font-semibold text-text-primary bg-secondary rounded-lg hover:opacity-90 transition-opacity border border-border-color"
                >
                     <svg className="w-5 h-5" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.574l6.19,5.238C41.346,34.773,44,30.021,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
                    </svg>
                    Entrar com Google
                </button>
                <p className="text-center text-sm">
                    Não tem uma conta?{' '}
                    <Link to="/signup" className="font-medium text-primary hover:underline">
                        Cadastre-se
                    </Link>
                </p>
            </div>
        </div>
    );
};

export default Login;