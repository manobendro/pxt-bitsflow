#include "pxt.h"

// The linux/vm platform's screen_init() calls updateScreen(), which is normally provided
// by a display/screen package. The bitsflow VM has no screen, so provide a no-op.
namespace pxt {
void updateScreen(Image_ img) {}
}
