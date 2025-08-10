import { format, parseISO, isValid } from "date-fns"
import { ptBR } from "date-fns/locale"

export function formatBrazilianDate(dateString: string | Date): string {
  let date: Date
  if (typeof dateString === "string") {
    date = parseISO(dateString)
  } else {
    date = dateString
  }

  if (!isValid(date)) {
    return "Data inválida"
  }

  return format(date, "dd/MM/yyyy", { locale: ptBR })
}

export function formatBrazilianDateTime(dateString: string | Date): string {
  let date: Date
  if (typeof dateString === "string") {
    date = parseISO(dateString)
  } else {
    date = dateString
  }

  if (!isValid(date)) {
    return "Data/Hora inválida"
  }

  return format(date, "dd/MM/yyyy HH:mm", { locale: ptBR })
}
