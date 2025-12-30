import { useState, type FC, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import './Login.css';

/**
 * Pantalla de Inicio de Sesión.
 * Gestiona la autenticación del usuario mediante credenciales (usuario/contraseña).
 */
const Login: FC = () => {
    const navigate = useNavigate();
    // Estados para campos del formulario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    // Estado para mensajes de error y carga
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    /**
     * Maneja el envío del formulario de login.
     * Llama al servicio de autenticación y guarda la sesión si es exitoso.
     */
    const handleLogin = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);
        try {
            // Llamada al servicio de autenticación
            const user = await authService.login({ nombreUsuario: username, contrasena: password });

            if (user) {
                // Guardar usuario en LocalStorage para persistencia de sesión
                localStorage.setItem('user', JSON.stringify(user));
                // Redirigir al inicio (Dashboard)
                navigate('/');
            } else {
                // Si el usuario no es válido, establece el mensaje de error directamente
                setError('Credenciales incorrectas. Por favor, inténtalo de nuevo.');
            }
        } catch (err) {
            console.error(err);
            setError('Ocurrió un error de red. Por favor, inténtalo de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <h1 className="login-title">KITS Login</h1>
                <form onSubmit={handleLogin} className="login-form">
                    {/* Campo Usuario */}
                    <div className="form-group">
                        <label className="form-label">Usuario</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="form-input"
                            disabled={loading}
                        />
                    </div>
                    {/* Campo Contraseña */}
                    <div className="form-group">
                        <label className="form-label">Contraseña</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="form-input"
                            disabled={loading}
                        />
                    </div>

                    {/* Mensaje de error si existe */}
                    {error && <p className="form-error">{error}</p>}

                    {/* Botón de envío */}
                    <button type="submit" className="btn btn-primary submit-button" disabled={loading}>
                        {loading ? 'Ingresando...' : (
                            <>
                                <LogIn size={18} />
                                <span>Ingresar</span>
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
