package org.kits.controllers;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.kits.bl.LUsuario;
import org.kits.dto.AuthResponse;
import org.kits.entities.Usuario;
import org.kits.security.JwtUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("usuario")
public class UsuarioController {
    private final LUsuario logica;
    private final JwtUtil jwtUtil;

    @Autowired
    public UsuarioController(LUsuario logica, JwtUtil jwtUtil) {
        this.logica = logica;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Lista todos los usuarios.
     * GET /usuario
     */
    @GetMapping
    public ResponseEntity<List<Usuario>> Listar() {
        return ResponseEntity.ok(this.logica.Listar());
    }

    /**
     * Autentica un usuario y devuelve un token JWT junto con sus datos.
     * POST /usuario/autenticar
     *
     * @return 200 con {token, usuario} si las credenciales son válidas; 401 en caso contrario.
     */
    @PostMapping("autenticar")
    public ResponseEntity<AuthResponse> Autenticar(@Valid @RequestBody LoginRequest request) {
        Usuario usuario = this.logica.Autenticar(request.getNombreUsuario(), request.getContrasena());
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        String token = this.jwtUtil.generarToken(usuario);
        return ResponseEntity.ok(new AuthResponse(token, usuario));
    }

    /**
     * Consulta un usuario por nombre de usuario.
     * GET /usuario/{username}
     */
    @GetMapping("{username}")
    public ResponseEntity<Usuario> Consultar(@PathVariable String username) {
        return ResponseEntity.ok(this.logica.Consultar(username));
    }

    /**
     * Crea o actualiza un usuario.
     * POST /usuario
     */
    @PostMapping
    public ResponseEntity<Integer> Guardar(@Valid @RequestBody Usuario usuario) {
        return ResponseEntity.ok(this.logica.Guardar(usuario));
    }

    /**
     * Cambia la contraseña del usuario de la sesión actual.
     * PUT /usuario/mi-contrasena
     *
     * <p>Disponible para cualquier usuario autenticado, sea cual sea su rol. El usuario
     * afectado sale del token, nunca del cuerpo de la petición: así nadie puede cambiar
     * la contraseña de otro por esta vía. Se exige la contraseña actual como
     * confirmación.</p>
     *
     * @return 200 si se cambió; 400 con el motivo si la contraseña actual no es correcta.
     */
    @PutMapping("mi-contrasena")
    public ResponseEntity<Void> CambiarMiContrasena(@Valid @RequestBody CambiarMiContrasenaRequest request,
                                                    Authentication authentication) {
        boolean cambiada = this.logica.CambiarContrasenaPropia(
                authentication.getName(), request.getContrasenaActual(), request.getNuevaContrasena());

        if (!cambiada) {
            // 400 y no 401: un 401 haría que el interceptor del frontend cerrara la
            // sesión, y aquí lo único que pasa es que se equivocó al teclear.
            throw new IllegalArgumentException("La contraseña actual no es correcta");
        }
        return ResponseEntity.ok().build();
    }

    /**
     * Restablece la contraseña de un usuario, sin pedir la actual.
     * PUT /usuario/cambiar-contrasena
     *
     * <p>Operación de administrador (ver {@code SecurityConfig}). Para que un usuario
     * cambie la suya, existe {@code PUT /usuario/mi-contrasena}.</p>
     */
    @PutMapping("cambiar-contrasena")
    public ResponseEntity<Void> CambiarContrasena(@Valid @RequestBody CambiarContrasenaRequest request) {
        this.logica.CambiarContrasena(request.getNombreUsuario(), request.getNuevaContrasena());
        return ResponseEntity.ok().build();
    }

    /**
     * Elimina (desactiva) un usuario por ID.
     * DELETE /usuario/{id}
     */
    @DeleteMapping("{id}")
    public ResponseEntity<Integer> Eliminar(@PathVariable int id) {
        return ResponseEntity.ok(this.logica.Eliminar(id));
    }

    /**
     * Activa un usuario desactivado.
     * PUT /usuario/{id}/activar
     */
    @PutMapping("{id}/activar")
    public ResponseEntity<Integer> Activar(@PathVariable int id) {
        return ResponseEntity.ok(this.logica.Activar(id));
    }

    /** Cuerpo de la petición de login. */
    public static class LoginRequest {
        @NotBlank(message = "El nombre de usuario es requerido")
        private String nombreUsuario;
        @NotBlank(message = "La contraseña es requerida")
        private String contrasena;

        public String getNombreUsuario() {
            return nombreUsuario;
        }

        public void setNombreUsuario(String nombreUsuario) {
            this.nombreUsuario = nombreUsuario;
        }

        public String getContrasena() {
            return contrasena;
        }

        public void setContrasena(String contrasena) {
            this.contrasena = contrasena;
        }
    }

    /** Cuerpo para que un usuario cambie su propia contraseña. El usuario sale del token. */
    public static class CambiarMiContrasenaRequest {
        @NotBlank(message = "La contraseña actual es requerida")
        private String contrasenaActual;
        @NotBlank(message = "La nueva contraseña es requerida")
        @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres")
        private String nuevaContrasena;

        public String getContrasenaActual() {
            return contrasenaActual;
        }

        public void setContrasenaActual(String contrasenaActual) {
            this.contrasenaActual = contrasenaActual;
        }

        public String getNuevaContrasena() {
            return nuevaContrasena;
        }

        public void setNuevaContrasena(String nuevaContrasena) {
            this.nuevaContrasena = nuevaContrasena;
        }
    }

    /** Cuerpo del restablecimiento de contraseña que hace un administrador. */
    public static class CambiarContrasenaRequest {
        @NotBlank(message = "El nombre de usuario es requerido")
        private String nombreUsuario;
        @NotBlank(message = "La nueva contraseña es requerida")
        @Size(min = 6, message = "La nueva contraseña debe tener al menos 6 caracteres")
        private String nuevaContrasena;

        public String getNombreUsuario() {
            return nombreUsuario;
        }

        public void setNombreUsuario(String nombreUsuario) {
            this.nombreUsuario = nombreUsuario;
        }

        public String getNuevaContrasena() {
            return nuevaContrasena;
        }

        public void setNuevaContrasena(String nuevaContrasena) {
            this.nuevaContrasena = nuevaContrasena;
        }
    }
}
