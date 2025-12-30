package org.kits.controllers;

import org.kits.bl.LUsuario;
import org.kits.entities.Usuario;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("usuario")
public class UsuarioController {
    private final LUsuario logica;

    @Autowired
    public UsuarioController(LUsuario logica) {
        this.logica = logica;
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
     * Autentica un usuario.
     * POST /usuario/autenticar
     */
    @PostMapping("autenticar")
    public ResponseEntity<Usuario> Autenticar(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(this.logica.Autenticar(usuario.getNombreUsuario(), usuario.getContrasena()));
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
    public ResponseEntity<Integer> Guardar(@RequestBody Usuario usuario) {
        return ResponseEntity.ok(this.logica.Guardar(usuario));
    }

    /**
     * Cambia la contraseña de un usuario.
     * PUT /usuario/cambiar-contrasena
     */
    @PutMapping("cambiar-contrasena")
    public ResponseEntity<Void> CambiarContrasena(@RequestBody CambiarContrasenaRequest request) {
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

    public static class CambiarContrasenaRequest {
        private String nombreUsuario;
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
