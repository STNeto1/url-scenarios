export const getPort = (port: number): number => {
  const envPort = process.env.PORT
  if (envPort) {
    return parseInt(envPort)
  }

  return port
}
