if (typeof window !== 'undefined') {
  // Safeguard for EventEmitter2 (used by @particle-network/auth-core)
  try {
    const { EventEmitter2 } = require('eventemitter2');
    if (EventEmitter2 && !EventEmitter2.prototype.off && EventEmitter2.prototype.removeListener) {
      EventEmitter2.prototype.off = EventEmitter2.prototype.removeListener;
    }
  } catch {
    // Module not found, skip
  }

  // Safeguard for Node's EventEmitter
  try {
    const { EventEmitter } = require('events');
    if (EventEmitter && !EventEmitter.prototype.off && EventEmitter.prototype.removeListener) {
      EventEmitter.prototype.off = EventEmitter.prototype.removeListener;
    }
  } catch {
    // Module not found, skip
  }

  // Safeguard for eventemitter3
  try {
    const EE3 = require('eventemitter3');
    const proto = EE3?.prototype || EE3?.EventEmitter?.prototype;
    if (proto && !proto.off && typeof proto.removeListener === 'function') {
      proto.off = proto.removeListener;
    }
    if (EE3 && !EE3.off && typeof EE3.removeListener === 'function') {
      EE3.off = EE3.removeListener;
    }
  } catch {
    // Module not found, skip
  }

  // Safeguard for injected Ethereum providers
  const eth: any = (window as any).ethereum;
  if (eth && !eth.off && typeof eth.removeListener === 'function') {
    eth.off = (...args: any[]) => eth.removeListener(...args);
  }
}