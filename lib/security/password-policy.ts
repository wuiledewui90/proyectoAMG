export function validatePasswordPolicy(password: string, admin = false) {
  const minimum = admin ? 14 : 10

  if (password.length < minimum || password.length > 128) {
    return `La contraseña debe tener entre ${minimum} y 128 caracteres.`
  }
  if (!/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]/.test(password) || !/\d/.test(password)) {
    return "La contraseña debe incluir al menos una letra y un número."
  }

  return null
}
