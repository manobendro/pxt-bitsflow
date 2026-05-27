cmake_minimum_required(VERSION 3.13)

if(NOT DEFINED ENV{PICO_SDK_PATH})
    message(FATAL_ERROR "PICO_SDK_PATH is not set. Clone pico-sdk and export PICO_SDK_PATH=/path/to/pico-sdk")
endif()

include($ENV{PICO_SDK_PATH}/external/pico_sdk_import.cmake)

project(bitsflow_vm_pico C CXX ASM)
set(CMAKE_C_STANDARD 11)
set(CMAKE_CXX_STANDARD 11)

pico_sdk_init()

set(PXTAPP "${CMAKE_CURRENT_LIST_DIR}/../../projects/vmtest/built/make/pxtapp")
set(GENERATED "${CMAKE_CURRENT_LIST_DIR}/generated")

file(GLOB BASE_CPP "${PXTAPP}/base/*.cpp")
set(CORE_CPP
    "${PXTAPP}/core/scheduler.cpp"
    "${PXTAPP}/core/config.cpp"
    "${PXTAPP}/core/target.cpp"
    "${PXTAPP}/core/control.cpp"
    "${PXTAPP}/core/dmesg.cpp"
    "${PXTAPP}/core/keys.cpp"
    "${PXTAPP}/core/vm.cpp"
    "${PXTAPP}/core/vmload.cpp"
    "${PXTAPP}/core/vmcache.cpp"
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
    PICO_STDIO_USB_CONNECT_WAIT_TIMEOUT_MS=0
)

target_compile_options(bitsflow_vm_pico PRIVATE
    -fwrapv
    -fno-threadsafe-statics
    -fno-rtti
    -fno-exceptions
    -fno-unwind-tables
    -Wno-unused-parameter
    -Wno-unused-variable
    -Wno-unused-function
)

target_link_libraries(bitsflow_vm_pico pico_stdlib hardware_sync hardware_watchdog)

pico_enable_stdio_usb(bitsflow_vm_pico 1)
pico_enable_stdio_uart(bitsflow_vm_pico 0)
pico_add_extra_outputs(bitsflow_vm_pico)
