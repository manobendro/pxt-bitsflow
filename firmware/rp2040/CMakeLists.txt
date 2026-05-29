cmake_minimum_required(VERSION 3.13)

if(NOT DEFINED ENV{PICO_SDK_PATH})
    message(FATAL_ERROR "PICO_SDK_PATH is not set. Clone pico-sdk and export PICO_SDK_PATH=/path/to/pico-sdk")
endif()

include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(bitsflow_vm_pico C CXX ASM)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 11)

pico_sdk_init()

# Which compiled project to embed + build against. The make-engine build of this
# project produces both binary.pxt64 (-> generated/vm_image.c) and the pxtapp/ C++.
if(NOT DEFINED PXT_PROJECT)
    set(PXT_PROJECT "blink")
endif()
set(PXTAPP "${CMAKE_CURRENT_LIST_DIR}/../../projects/${PXT_PROJECT}/built/make/pxtapp")
set(GENERATED "${CMAKE_CURRENT_LIST_DIR}/generated")

file(GLOB BASE_CPP "${PXTAPP}/base/*.cpp")
# Core VM sources. vmcache.cpp is intentionally excluded — it is an optional on-disk
# image cache (dirent/opendir/fopen) that bare metal lacks and the boot path never uses.
set(CORE_CPP
    "${PXTAPP}/core/scheduler.cpp"
    "${PXTAPP}/core/config.cpp"
    "${PXTAPP}/core/target.cpp"
    "${PXTAPP}/core/control.cpp"
    "${PXTAPP}/core/dmesg.cpp"
    "${PXTAPP}/core/keys.cpp"
    "${PXTAPP}/core/led.cpp"
    "${PXTAPP}/core/vm.cpp"
    "${PXTAPP}/core/vmload.cpp"
    "${PXTAPP}/core/verify.cpp"
)

add_executable(bitsflow_vm_pico
    ${BASE_CPP}
    ${CORE_CPP}
    "${PXTAPP}/pointers.cpp"
    "${CMAKE_CURRENT_LIST_DIR}/src/rp2040_platform.cpp"
    "${CMAKE_CURRENT_LIST_DIR}/src/rp2040_main.cpp"
    "${GENERATED}/vm_image.c"
)

target_include_directories(bitsflow_vm_pico PRIVATE
    "${CMAKE_CURRENT_LIST_DIR}/include"
    "${PXTAPP}"
    "${PXTAPP}/base"
    "${PXTAPP}/core"
)

target_compile_definitions(bitsflow_vm_pico PRIVATE
    PXT32=1
    PXT_VM=1
    PXT_RP2040=1
    # GC heap = 2^17 = 128KB (fits RP2040's 264KB SRAM). Default would be 1MB.
    PXT_VM_HEAP_ALLOC_BITS=17
    PICO_STDIO_USB_CONNECT_WAIT_TIMEOUT_MS=0
)

target_compile_options(bitsflow_vm_pico PRIVATE
    -fwrapv
    -fno-threadsafe-statics
    -fno-rtti
    -fno-exceptions
    -fno-unwind-tables
    # The VM C++ was written for x86/x64 where int32_t == int. On 32-bit ARM newlib
    # int32_t is `long`, so int*/int32_t* assignments are a hard error without this.
    -fpermissive
    -Wno-unused-parameter
    -Wno-unused-variable
    -Wno-unused-function
)

target_link_libraries(bitsflow_vm_pico pico_stdlib hardware_sync hardware_watchdog)

# Serial output goes to BOTH USB CDC and UART0 (GPIO0=TX, GPIO1=RX, 115200 8N1).
pico_enable_stdio_usb(bitsflow_vm_pico 1)
pico_enable_stdio_uart(bitsflow_vm_pico 1)
pico_add_extra_outputs(bitsflow_vm_pico)
