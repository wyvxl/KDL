-- SCRIPT 01b: USUARIO PARA ORACLE AUTONOMOUS DATABASE (Oracle Cloud Always Free)
--
-- Reemplaza al script 01 cuando la base está en la nube. Se ejecuta conectado como
-- ADMIN (en Database Actions > SQL). Después se entra como KITS y se corren los
-- scripts 02 a 12 igual que en local.
--
-- Diferencias con el 01:
--   * Autonomous exige contraseñas de 12 a 30 caracteres con mayúscula, minúscula y
--     número, y que no contengan el nombre de usuario: 'Kits2025' se rechaza.
--   * Varios privilegios "ANY" están restringidos y no hacen falta: KITS solo crea
--     objetos en su propio esquema.
--   * El tablespace de datos se llama DATA.
--
-- CAMBIA LA CONTRASEÑA antes de ejecutarlo y guárdala: es la que va en DB_PASSWORD en Render.

CREATE USER KITS IDENTIFIED BY "CambiaEsta_Clave2026";

GRANT CREATE SESSION   TO KITS;
GRANT CREATE TABLE     TO KITS;
GRANT CREATE VIEW      TO KITS;
GRANT CREATE SEQUENCE  TO KITS;
GRANT CREATE PROCEDURE TO KITS;
GRANT CREATE TRIGGER   TO KITS;
GRANT CREATE TYPE      TO KITS;

ALTER USER KITS QUOTA UNLIMITED ON DATA;

-- Permite que KITS entre a Database Actions (SQL Developer Web) con su propio usuario
-- para correr los scripts 02-12. Si da error, se puede hacer desde la consola:
-- Database Actions > Administración > Usuarios de Base de Datos > KITS > Activar REST.
BEGIN
    ORDS_ADMIN.ENABLE_SCHEMA(
        p_enabled             => TRUE,
        p_schema              => 'KITS',
        p_url_mapping_type    => 'BASE_PATH',
        p_url_mapping_pattern => 'kits',
        p_auto_rest_auth      => TRUE
    );
    COMMIT;
END;
/
