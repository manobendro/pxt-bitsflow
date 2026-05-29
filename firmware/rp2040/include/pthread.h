#pragma once
// Minimal single-threaded pthread shim for the PXT VM on bare metal.
//
// newlib already defines the pthread *types* (pthread_t / pthread_mutex_t /
// pthread_cond_t, via <sys/types.h>), so we must NOT redefine them — doing so
// conflicts with newlib. We only supply trivial implementations of the handful of
// functions the VM calls: mutex/cond are no-ops (interrupts guard critical sections)
// and pthread_create runs the thread body synchronously on the caller's stack.
#include <sys/types.h>

static inline int pthread_mutex_lock(pthread_mutex_t *m) { (void)m; return 0; }
static inline int pthread_mutex_unlock(pthread_mutex_t *m) { (void)m; return 0; }
static inline int pthread_mutex_trylock(pthread_mutex_t *m) { (void)m; return 0; }
static inline int pthread_cond_broadcast(pthread_cond_t *c) { (void)c; return 0; }
static inline int pthread_cond_wait(pthread_cond_t *c, pthread_mutex_t *m) { (void)c; (void)m; return 0; }
static inline int pthread_join(pthread_t t, void **r) { (void)t; (void)r; return 0; }
static inline pthread_t pthread_self(void) { return 1; }
static inline void pthread_exit(void *r) { (void)r; while (1) {} }
static inline int pthread_create(pthread_t *t, const void *attr, void *(*fn)(void *), void *arg) {
    (void)attr;
    if (t) *t = 1;
    fn(arg);
    return 0;
}
