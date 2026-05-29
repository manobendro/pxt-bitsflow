# PXT VM runtime image — builds a MakeCode program to .pxt64 bytecode AND
# compiles the native pxt-vm-cli interpreter, then runs the bytecode.
#
# Everything happens inside Linux for maximum portability: the C++ runtime is
# built with gcc/make here, so the Windows host needs nothing but Docker.
#
# The workspace (the parent of pxt-bitsflow, containing both `pxt` and
# `pxt-bitsflow`) is bind-mounted at /work at run time — see docker/entrypoint.sh
# and tools/docker-vm.ps1.
FROM node:20-bookworm

# C/C++ toolchain for the core---vm Makefile (gcc, g++, make).
RUN apt-get update \
    && apt-get install -y --no-install-recommends build-essential \
    && rm -rf /var/lib/apt/lists/*

# The tiny `pxt` launcher: locates node_modules/pxt-core/built/pxt.js and runs it.
RUN npm install -g pxt@0.5.1

# Never try to shell out to a nested Docker for the C++ build — we ARE the build env.
ENV PXT_NODOCKER=1

WORKDIR /work/pxt-bitsflow

COPY entrypoint.sh /usr/local/bin/pxt-vm-entry.sh
RUN chmod +x /usr/local/bin/pxt-vm-entry.sh

ENTRYPOINT ["/usr/local/bin/pxt-vm-entry.sh"]
