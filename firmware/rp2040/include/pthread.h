#pragma once
#include <stdint.h>

typedef int pthread_t;
typedef int pthread_mutex_t;
typedef int pthread_cond_t;

static inline int pthread_mutex_lock(pthread_mutex_t *) { return 0; }
static inline int pthread_mutex_unlock(pthread_mutex_t *) { return 0; }
static inline int pthread_mutex_trylock(pthread_mutex_t *) { return 0; }
static inline int pthread_cond_broadcast(pthread_cond_t *) { return 0; }
static inline int pthread_cond_wait(pthread_cond_t *, pthread_mutex_t *) { return 0; }
static inline int pthread_join(pthread_t, void **) { return 0; }
static inline pthread_t pthread_self(void) { return 1; }
static inline void pthread_exit(void *) { while (1) {} }
static inline int pthread_create(pthread_t *t, const void *, void *(*fn)(void *), void *arg) {
    if (t) *t = 1;
    fn(arg);
    return 0;
}
