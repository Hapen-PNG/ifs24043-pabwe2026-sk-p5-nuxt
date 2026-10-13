import { ref, type Ref } from "vue";

/**
 * Composable untuk mengelola nilai input form.
 * Mengembalikan tuple: [nilai reaktif, handler perubahan (event input), fungsi reset].
 */
export function useInput(
  initialValue: string
): [Ref<string>, (event: Event) => void, () => void] {
  const value = ref(initialValue);

  const onChange = (event: Event) => {
    value.value = (event.target as HTMLInputElement).value;
  };

  const reset = () => {
    value.value = initialValue;
  };

  return [value, onChange, reset];
}
