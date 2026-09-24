import jsPDF from 'jspdf'

export type ReservationPdfData = {
  id: string
  nombre: string
  tipoEvento: string
  descripcion: string
  fecha: string
  horaInicio: string
  horaFin: string
  duracion: string
  estado: string
  fechaCreacion: string
  solicitante: {
    nombre: string
    dependencia: string
    cargo: string
  }
  registrador: {
    nombre: string
    dependencia: string
  }
}

const addSectionTitle = (pdf: jsPDF, title: string, y: number) => {
  pdf.setFillColor(31, 130, 64)
  pdf.rect(15, y - 5, 180, 8, 'F')
  pdf.setTextColor(255, 255, 255)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(10)
  pdf.text(title, 19, y)
  pdf.setTextColor(29, 29, 27)
  return y + 10
}

const addField = (pdf: jsPDF, label: string, value: string, y: number) => {
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${label}:`, 18, y)
  pdf.setFont('helvetica', 'normal')
  const lines = pdf.splitTextToSize(value || 'No registrado', 135) as string[]
  pdf.text(lines, 58, y)
  return y + Math.max(6, lines.length * 5)
}

export const generateReservationPdf = (data: ReservationPdfData) => {
  const pdf = new jsPDF()
  let y = 20

  pdf.setTextColor(31, 130, 64)
  pdf.setFont('helvetica', 'bold')
  pdf.setFontSize(17)
  pdf.text('RESERVA DE AUDITORIO', 105, y, { align: 'center' })
  y += 8
  pdf.setFontSize(12)
  pdf.text('ICBF REGIONAL PUTUMAYO', 105, y, { align: 'center' })
  pdf.setTextColor(29, 29, 27)
  y += 14

  y = addSectionTitle(pdf, 'DATOS DE LA RESERVA', y)
  y = addField(pdf, 'ID Reserva', data.id, y)
  y = addField(pdf, 'Nombre', data.nombre, y)
  y = addField(pdf, 'Tipo de evento', data.tipoEvento, y)
  y = addField(pdf, 'Descripción', data.descripcion, y)
  y = addField(pdf, 'Fecha', data.fecha, y)
  y = addField(pdf, 'Hora Inicio', data.horaInicio, y)
  y = addField(pdf, 'Hora Fin', data.horaFin, y)
  y = addField(pdf, 'Duración', data.duracion, y)
  y = addField(pdf, 'Estado', data.estado, y)
  y = addField(pdf, 'Fecha de Creación', data.fechaCreacion, y)
  y += 5

  y = addSectionTitle(pdf, 'SOLICITANTE DEL EVENTO', y)
  y = addField(pdf, 'Nombre', data.solicitante.nombre, y)
  y = addField(pdf, 'Dependencia', data.solicitante.dependencia, y)
  y = addField(pdf, 'Cargo', data.solicitante.cargo, y)
  y += 5

  y = addSectionTitle(pdf, 'USUARIO QUE REGISTRÓ LA RESERVA', y)
  y = addField(pdf, 'Nombre', data.registrador.nombre, y)
  y = addField(pdf, 'Dependencia', data.registrador.dependencia, y)
  y += 5

  y = addSectionTitle(pdf, 'INFORMACIÓN DE AUDITORÍA', y)
  y = addField(pdf, 'Fecha de generación', new Intl.DateTimeFormat('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(new Date()), y)
  y = addField(pdf, 'Sistema', 'Reserva Auditorio ICBF Regional Putumayo', y)
  y = addField(pdf, 'Clasificación', 'Uso Interno', y)

  const now = new Date()
  const pad = (value: number) => String(value).padStart(2, '0')
  const filename = `Reserva_Auditorio_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.pdf`
  pdf.save(filename)
}