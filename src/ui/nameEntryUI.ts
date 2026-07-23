function el<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

/** Tela inicial de entrada de nome do caçador (3–16 caracteres). */
export class NameEntryUI {
  private screen = el('name-screen');
  private input = el<HTMLInputElement>('name-input');
  private error = el('name-error');
  private button = el<HTMLButtonElement>('btn-start');

  bind(onStart: (name: string) => void): void {
    const submit = () => {
      const name = this.input.value.trim();
      if (name.length < 3) {
        this.error.textContent = 'O nome precisa ter ao menos 3 caracteres.';
        return;
      }
      this.error.textContent = '';
      onStart(name);
    };
    this.button.addEventListener('click', submit);
    this.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') submit();
    });
  }

  show(): void {
    this.screen.classList.remove('hidden');
    this.input.focus();
  }

  hide(): void {
    this.screen.classList.add('hidden');
  }
}
