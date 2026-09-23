package org.kits.security;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;

import java.util.Set;

/**
 * Qué estados de pedido puede fijar cada rol.
 *
 * <p>{@link SecurityConfig} solo decide quién llega a {@code PUT /pedido/{id}/estado}; aquí
 * se decide a qué estado. Sin esta regla el vendedor, que entra a ese endpoint para
 * cancelar, también podía marcar pedidos como entregados, y cocina o reparto podían
 * cancelarlos. El orden de las transiciones (PENDIENTE -> EN_PROCESO -> ...) lo valida la BD
 * en {@code sp_actualizar_estado_pedido}.</p>
 */
public final class PermisosPedido {

    private static final Set<String> AVANCE = Set.of("EN_PROCESO", "LISTO", "ENTREGADO");
    private static final Set<String> CANCELACION = Set.of("CANCELADO");

    private PermisosPedido() {
    }

    /**
     * @return {@code true} si el usuario puede pasar un pedido al estado indicado.
     */
    public static boolean puedeCambiarA(Authentication authentication, String estado) {
        if (tieneRol(authentication, "ADMIN")) {
            return true;
        }
        if (CANCELACION.contains(estado)) {
            return tieneRol(authentication, "VENDEDOR");
        }
        if (AVANCE.contains(estado)) {
            return tieneRol(authentication, "PANADERO") || tieneRol(authentication, "REPARTIDOR");
        }
        return false;
    }

    /**
     * Crear o editar un pedido en un estado distinto de PENDIENTE (cargas de datos,
     * correcciones) es solo del administrador: el resto lo avanza con el flujo normal.
     */
    public static boolean puedeFijarEstadoAlGuardar(Authentication authentication) {
        return tieneRol(authentication, "ADMIN");
    }

    private static boolean tieneRol(Authentication authentication, String rol) {
        if (authentication == null) {
            return false;
        }
        String authority = "ROLE_" + rol;
        for (GrantedAuthority granted : authentication.getAuthorities()) {
            if (authority.equals(granted.getAuthority())) {
                return true;
            }
        }
        return false;
    }
}
