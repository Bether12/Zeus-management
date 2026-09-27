const { copyFile, readFile, writeFile, BaseDirectory } = window.__TAURI__.fs;
const { save, open } = window.__TAURI__.dialog;
const DB_NAME = 'gym.db';

function getBackupFileName() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    
    return `zeus_backup_${year}-${month}-${day}_${hours}${minutes}${seconds}.db`;
}

export async function exportBackup(dbInstance) {
    try {
        
        if (dbInstance) {
            await dbInstance.db.execute('PRAGMA wal_checkpoint(TRUNCATE);');
        }

        const defaultName = getBackupFileName();
        const targetPath = await save(
            {
                title: 'Guardar copia de seguridad',
                defaultPath: defaultName,
                filters: [{
                    name: 'Base de datos SQLite',
                    extensions: ['db', 'sqlite']
                }]
            });

        if (!targetPath) return { success: false, message: 'Operación cancelada.' };

        const dbBytes = await readFile('gym.db', {
            baseDir: BaseDirectory.AppData
        });

        await writeFile(targetPath, dbBytes);

        return { success: true, message: 'Copia de seguridad exportada con éxito.' };

    } catch (error) {
        console.error('Error al exportar respaldo:', error);
        return { success: false, message: `Error al exportar: ${error.message || error}` };
    }
}

async function isValidSqliteFile(filePath) {
    try {
        const fileData = await readFile(filePath);
        if (fileData.length < 16) return false;

        const header = String.fromCharCode(...fileData.slice(0, 15));
        return header === 'SQLite format 3';
    } catch (e) {
        console.error('Error al validar cabecera de la BD:', e);
        return false;
    }
}

export async function importBackup(dbInstance) {
    try {
        
        const selectedPath = await open({
            title: 'Seleccionar copia de seguridad',
            multiple: false,
            filters: [{
                name: 'Base de datos SQLite',
                extensions: ['db', 'sqlite']
            }]
        });

        if (!selectedPath) return { success: false, message: 'Operación cancelada.' };

        const isValid = await isValidSqliteFile(selectedPath);
        if (!isValid) {
            return { 
                success: false, 
                message: 'El archivo seleccionado no es una base de datos SQLite válida o está dañado.' 
            };
        }

        const tempBackup = `${DB_NAME}.tmp`;
        try {
            await copyFile(DB_NAME, tempBackup, {
                fromPathBaseDir: BaseDirectory.AppConfig,
                toPathBaseDir: BaseDirectory.AppConfig
            });
        } catch (_) {
            
        }

        if (dbInstance) {
            await dbInstance.db.execute('PRAGMA wal_checkpoint(TRUNCATE);');
        }

        const pathBytes = await readFile(selectedPath);

        //Replace internal database with the imported one
        await writeFile(DB_NAME, pathBytes, {
            baseDir: BaseDirectory.AppData
        });

        return { success: true, message: 'Base de datos restaurada correctamente.' };

    } catch (error) {
        console.error('Error al importar respaldo:', error);
        return { success: false, message: `Error al importar: ${error.message || error}` };
    }
}