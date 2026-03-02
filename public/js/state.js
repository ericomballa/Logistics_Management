class State {
  constructor() {
    this.listeners = [];
    this.data = {
      user: null,
      authToken: localStorage.getItem('authToken'),
      theme: 'dark',
    };
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;

    // Persist specific keys
    if (key === 'authToken') {
      if (value) localStorage.setItem('authToken', value);
      else localStorage.removeItem('authToken');
    }

    this.notify(key, value);
  }

  subscribe(listener) {
    this.listeners.push(listener);
    return () => (this.listeners = this.listeners.filter((l) => l !== listener));
  }

  notify(key, value) {
    this.listeners.forEach((listener) => listener(key, value));
  }

  get isAuthenticated() {
    return !!this.data.authToken;
  }

  get isAdmin() {
    return (
      this.data.user && (this.data.user.role === 'ADMIN' || this.data.user.role === 'SUPER_ADMIN')
    );
  }

  get isAgent() {
    return this.data.user && this.data.user.role === 'AGENT';
  }

  get isSecretary() {
    return this.data.user && this.data.user.role === 'SECRETARY';
  }
}

export const state = new State();
