Introduction
Hi, welcome to another video.
What React Grab is
So, I came across this tool and thought
I should talk about it as well. This one
is called React Grab. React Grab allows
you to grab any element in your app and
give it to cursor, claw or code editors.
So basically you run your app and let's
say you want to edit the color or look
of a button or a section then you can
grab that within your browser. It
automatically communicates with the
coder of your choice like cursor or
claude and then puts the exact location
of the element in the prompt box for the
coder to refer to.
This is something that has been done
before as well with a tool called stage
wise. It was quite similar, although it
focused more on allowing you to send
prompts from the app itself by selecting
an element rather than just putting the
specific element in the prompt box, but
it's generally similar. They say that by
default, coding agents cannot access
elements on your page. React Grab fixes
this. Just point and click to provide
context.
Hold command plus C and click on any
element on your page. Works with cursor,
claude code, open code, just a single
script tag. It automatically integrates
with things like claude, open code and
cursor as per their documentation,
but it actually works with anything
because it just copies the prompt for
your coder. That allows it to pinpoint
the element as well. So, you just copy
the prompt from your front end that
pinpoints the element, then paste it
into your coder of choice with the thing
that you want it to do, and it just
works, which is pretty great. It works
with the next.js app router, pages
router, and vite.
You can also integrate it into almost
anything as it's just a script tag that
you can put anywhere, and it should work
pretty well.
Now, let me show you how it all works.
PhotoGenius AI (Sponsor)
But before we do that, let me tell you
about today's sponsor, Photo Genius AI.
Photogenius AI is an all-in-one AI
powered creation suite that lets you
type anything and get stunning visuals
instantly. Now, also the best place to
use Google's Nano Banana for images and
V3 for videos, plus affordable 3D model
generation. Inside the image playground,
Nano Banana shines for fast, highquality
image generation. and you can add
reference images and do edits right in
the tool. You also get flux, stable
diffusion, kandinsky, and more in one
place. The video playground supports
Google VO3 with and without reference
images, and you can render in different
styles without the usual complexity.
Great for coders who want results, not
knobs. For 3D, you can upload a PNG,
think a Lego build or a simple robot,
and get a printable model, cheap, quick,
and surprisingly clean for rapid
prototyping. Pricing is among the best
for VO3 and Nano Banana. And you still
have access to about 10 other handy AI
tools like avatars, background removal,
logo, emoji, ads, and app icons in the
creative tool suite. It starts at a low
entry price, and you can take an
additional 30% off with my coupon code
king30. Check Photo Genius out through
the link in the description and try it
for yourself. Now, back to the video.
Setup & Usage
So, first of all, you'll have to head on
over to the React Grab repo. It's quite
simple to integrate. You need to replace
the contents of the layout file with
this code. If you already have an
application and your layout file has
other code, then you'll just need to add
this import at the top and then place
this block in the head section of the
layout. And that's all you need to do
for the pages router. It's also mostly
similar. And for Vite, you'll have to
install the package for it, then
integrate it as a plugin, and it should
work. This automatically starts when
you're in development mode, so it's not
something that you'll need to remove
every time you deploy, which is quite
great. Anyway, once that's done, you can
start it. Then, in your app, you can
press command plus C, move around with
your cursor, and select the element you
want to edit.
It will show a glowing pink highlight on
it. Then you just click on it. It'll
copy to your clipboard and you can paste
it into the coder of your choice.
Like here I have kilo code open. You can
just paste it in after writing the
prompt about what you want it to do and
it will immediately get to work. It
really comes in handy when there are
many elements on your page and writing a
simple prompt doesn't work as precisely.
So yeah, this makes sense in those
cases. It only provides the HTML
indexing though. It would have been
really nice if it somehow gave the
actual line number, original file name,
and correct element name, but it doesn't
do that yet. I think that might be a bit
hard to implement because stage wise
doesn't have that either.
So yeah, this is pretty great.
It integrates with almost all kinds of
coders including cursor
kilo and others. It simply copies the
element trace to your clipboard and then
you can give it to almost anything.
It's not as fleshed out as something
like stage wise though. In stage wise
it's a more real experience because it
integrates directly with coding agents.
You can click an element and it opens a
prompt box in the application itself.
You then write your prompt. It
automatically sends the message to your
coding agent and after a bit the feature
or design change gets updated.
So yeah, it's not as advanced, but it's
much easier than stage wise to work
with.
Stage wise can get a bit clunky.
It's harder to install and ensure smooth
functionality,
but this is a simple implementation.
You just copy the snippet, paste it into
your codebase, and you don't even need
to install any large package that bogs
down your app memory. You can work with
it and remove it anytime as it's just
one small snippet. It works with all
kinds of coding tools because it simply
copies a prompt chunk that you can paste
anywhere. Even if you're not using a
coding agent and just want to debug
something, you can use it with chat GPT.
Give it your code along with the trace
from React Grab and it can work on it.
So yeah, this is quite awesome. It's
also pretty snappy and it works the
first time without any errors. It's
still limited to React though, so if you
use something else, it won't work. But
for most people, that's fine. This is
great for vibe coders as well who want
to pinpoint their edits without breaking
something else while trying to fix
another thing.
I really like these small and simple
tools, and that's why I wanted to talk
about this one, too. Go ahead and check
it out. That's mostly about it.
Overall, it's pretty cool. Anyway, share
Ending
your thoughts below and subscribe to the
channel. You can also donate via Super
thanks option or join the channel as
well and get some perks. I'll see you in
the next video. Bye.
