# Shared Docker bind-mount args for the Bitsflow VM containers.
#
# The host links pxt-core / pxt-common-packages / libs/base as Windows JUNCTIONS to the
# sibling clones under the workspace. Docker Desktop does NOT follow Windows junctions in
# a bind mount, so we bind-mount the sibling clones directly onto those container paths.
# These overlays affect only the container's view — the host junctions are never modified
# (which is what kept breaking host `pxt serve`).
function Get-PicoMounts([string]$workspace) {
    return @(
        "-v", "${workspace}:/work",
        "-v", "${workspace}\pxt:/work/pxt-bitsflow/node_modules/pxt-core",
        "-v", "${workspace}\pxt-common-packages:/work/pxt-bitsflow/node_modules/pxt-common-packages",
        "-v", "${workspace}\pxt-common-packages\libs\base:/work/pxt-bitsflow/libs/base"
    )
}
