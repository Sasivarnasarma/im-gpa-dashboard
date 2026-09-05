import React from 'react';

// Shows a recoverable screen instead of a blank page on a render crash.
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('GPA Dashboard crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen bg-canvas text-body-text flex items-center justify-center p-4">
        <div className="border border-hairline bg-surface-soft p-8 rounded-none max-w-md w-full text-center flex flex-col gap-4">
          <h2 className="font-bmw-display font-bold text-lg text-white uppercase tracking-tight">
            Something went wrong
          </h2>
          <p className="text-xs text-muted-text leading-relaxed">
            The dashboard hit an unexpected error and couldn't render. Your saved grades are
            untouched. Try reloading — if it keeps happening, clear the app's data from Reset.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 bg-m-red hover:bg-m-red/80 text-white text-xs font-bmw-display font-bold uppercase tracking-widest rounded-none transition-colors border border-m-red cursor-pointer"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
