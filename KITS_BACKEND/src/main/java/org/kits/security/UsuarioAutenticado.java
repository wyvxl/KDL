package org.kits.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticatedPrincipal;

/**
 * Identidad del usuario de la petición, tomada del token JWT.
 *
 * <p>Se guarda como principal en el contexto de seguridad para que los controladores
 * puedan saber <em>quién</em> está haciendo la operación sin tener que fiarse del cuerpo
 * de la petición. Antes {@code idUsuario} venía en el JSON, así que cualquier usuario
 * autenticado podía atribuirle un pedido o un cambio de estado a otra persona.</p>
 *
 * <p>Implementa {@link AuthenticatedPrincipal} para que {@code Authentication.getName()}
 * siga devolviendo el nombre de usuario.</p>
 */
public record UsuarioAutenticado(Integer idUsuario, String nombreUsuario) implements AuthenticatedPrincipal {

    @Override
    public String getName() {
        return nombreUsuario;
    }

    /**
     * Extrae el id del usuario autenticado.
     *
     * @return el id, o {@code null} si la petición no tiene una identidad de este tipo.
     */
    public static Integer idDe(Authentication authentication) {
        return authentication != null && authentication.getPrincipal() instanceof UsuarioAutenticado usuario
                ? usuario.idUsuario()
                : null;
    }
}
