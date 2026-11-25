"""Tiny background prefetch pool.

AI batches (10 MCQs, 5 riddles) take 10-20s to generate. We keep ONE ready-made batch per game
in memory: requests are answered instantly from the pool, then a background thread refills it.
Falls back transparently to normal live generation when the pool is empty / doesn't fit.
"""
import threading


class BatchPool:
    def __init__(self, name, generate, count, key):
        """generate(count, exclude) -> (items, source); key(item) -> str used for de-duplication."""
        self.name, self._generate, self.count, self._key = name, generate, count, key
        self._batch = None
        self._lock = threading.Lock()
        self._filling = False

    def take(self, count, exclude):
        """Return a ready batch (list) or None. Never returns items the caller already played."""
        if count != self.count:
            return None
        ex = {e.lower() for e in exclude}
        with self._lock:
            batch, self._batch = self._batch, None
        self.refill()
        if not batch:
            return None
        if any(self._key(i).lower() in ex for i in batch):
            return None  # stale versus what the client already played -> generate live instead
        return batch

    def refill(self):
        with self._lock:
            if self._batch is not None or self._filling:
                return
            self._filling = True
        threading.Thread(target=self._run, daemon=True).start()

    def _run(self):
        try:
            items, _ = self._generate(self.count, [])
            with self._lock:
                self._batch = items
        except Exception:
            pass  # AI down / key missing: live path will surface a proper error
        finally:
            with self._lock:
                self._filling = False
