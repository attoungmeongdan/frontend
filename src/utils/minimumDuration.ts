/** Start the timer with the request, including failures; slow requests incur no extra delay. */
export async function withMinimumDuration<T>(
  work: () => Promise<T>,
  milliseconds = 500,
): Promise<T> {
  const minimum = new Promise<void>((resolve) => setTimeout(resolve, milliseconds));
  try {
    return await work();
  } finally {
    await minimum;
  }
}
