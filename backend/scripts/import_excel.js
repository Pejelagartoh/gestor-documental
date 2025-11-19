import XLSX from 'xlsx';
import path from 'path';
const file = path.resolve('../Registro Documental FORM.xlsm'); // ajustar si es necesario
console.log('Leyendo', file);
const wb = XLSX.readFile(file, { cellDates: true });
const sheet = 'Registro de Documentos';
const data = XLSX.utils.sheet_to_json(wb.Sheets[sheet], { defval: null });
console.log('Registros leídos:', data.length);
console.log(data.slice(0,5));
