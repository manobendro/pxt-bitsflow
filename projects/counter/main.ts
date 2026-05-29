// A slightly richer sample than vmtest: exercises variables, arithmetic and a
// conditional inside the forever loop, so the VM output changes every tick.
let count = 0
basic.forever(function () {
    count += 1
    console.log("count = " + count + ", square = " + (count * count))
    if (count % 5 == 0) {
        console.log("  -> " + count + " is a multiple of 5!")
    }
    basic.pause(300)
})
