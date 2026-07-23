package org.kits.dto;

import org.kits.entities.Usuario;

/**
 * Respuesta del endpoint de autenticación: token JWT y datos del usuario autenticado.
 *
 * @param token    Token JWT a enviar en el encabezado Authorization (Bearer) en las siguientes peticiones.
 * @param usuario  Datos del usuario autenticado (incluye rol y permisos).
 */
public record AuthResponse(String token, Usuario usuario) {
}
