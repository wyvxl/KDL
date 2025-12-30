package org.kits.controllers;

import org.kits.bl.LRol;
import org.kits.entities.Rol;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("rol")
public class RolController {
    private final LRol logica;

    @Autowired
    public RolController(LRol logica) {
        this.logica = logica;
    }

    /**
     * Lista todos los roles disponibles.
     * GET /rol
     *
     * @return Lista de roles
     */
    @GetMapping
    public ResponseEntity<List<Rol>> Listar() {
        return ResponseEntity.ok(this.logica.Listar());
    }

    /**
     * Crea un nuevo rol.
     * POST /rol
     *
     * @param rol Datos del rol
     * @return Rol creado con su ID
     */
    @PostMapping
    public ResponseEntity<Rol> Guardar(@RequestBody Rol rol) {
        int nuevoId = this.logica.Guardar(rol);
        if (nuevoId > 0) {
            rol.setIdRol(nuevoId);
            return ResponseEntity.status(HttpStatus.CREATED).body(rol);
        } else {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
