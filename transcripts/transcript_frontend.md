4-step workflow
Most time when we ask cursor to generate
UI at default always generate this type
of UI that you look at it you know it's
AI generated. So for the past few days
I've been looking to how can you get a
model to generate much more personalized
and unique design that has your branding
interesting interaction pattern and most
importantly once you have one UI
component that meets your quality and
taste. You can scale it to all sorts of
different UI components that has the
same standard and quality across your
whole application. And here I want to
showcase what my overall workflow is so
that you can really level up the design
large model produce for you. And firstly
I want to talk about a concept called
flow engineer. It is something Andrew
Kepsi mentioned about one and a half
years ago. Instead of prompt engineer we
just give model a prompt and expect
output something. The most sophisticated
way is actually distill the expertise
knowledge into a flow so that the output
from the larger learning model can be
constructed iteratively. And what I mean
by that is instead of try to figure out
the perfect prompt possible, try to
think about what are the core elements a
really senior designer going to do to
produce a unique design. From my
experience as designer, normally I would
design in multiple different steps. I
will firstly try to figure out layout.
What type of user journey will be so
that I can decide the information
hierarchy and once I confirm the layout
then I'll try to figure out the right
scene the branding so that I can put
together a high fidelity mockup. And
meanwhile, I also want to add a little
bit touch of animation. Only after that,
we can start implementing on the front
end. And at each step, large length
model might produce multiple different
results. I will iterate until I get one
version that I like. And this four steps
I list out here are just a starting
point that I experimented past few days.
There are a lot more things can be tried
and think about like the reference mode,
user flow as well as content hierarchy.
So there are a lot more things can be
experimented, but I will just talk about
this basic flow that I tried so far and
really to get you guys to experiment
different things. First, I want to talk
Layout
about layout. This is like a typical
oneshot UI you would get from those
model. It kind of feels functional, but
a lot of detail just didn't look right.
For example, this didn't make sense to
be centered. It should probably be left
aligned and also it might miss some
information that I think is useful like
a description of the property and some
call to action button. And once I found
really useful is actually align on the
layout pretty early on. One interesting
experience I found is you can actually
use key as a very quick and fast way to
align the layout with large language
model. There was one time I tried to
build a chat UI and I just prompted to
hey help me think through the layout
first. The model just output the whole
UI in asky and that was time I was quite
surprised because it is actually pretty
effective way for me to understand did a
model understand what I want. Did it
actually cover all the functionality
that I intended to implement but most
importantly it is way faster for a model
to generate asky wireframe like this
rather than implementing whole HTML or
react page. So quite typical I went
through when I was designing super
design or even in cursor is that I will
ask it to quickly output ask key
wireframe of what the UI should look
like and you can see here this is real
time I haven't added it's super fast I
get a quick result within like 1 second
and then I can quickly give feedback to
realign what I want then it will very
quickly generate a kind of new UI for me
and obviously we can like back and forth
a few times so this is extremely fast
and cheap way for me to align with model
about what the layout should look like
and dramatically increase the chance
that the output it generate is going to
satisfy our needs and you can even use
that to communicate some interaction as
well. In this example where I try to
demonstrate the chat UI, it will firstly
generate this main UI of chat but also
show me when user click on hamburger
menu a sidebar should show up that push
the main interface away. It can also
handle some bit more sophisticated UI
like crypto trading it will have some
creative way to figure out how to
present and communicate UI with you. And
with that I even tried something more
kind of like creative work. This is what
I got when I asked it to like design a
poster for AI builder club and it is
also able to generate those type of
content hierarchy or post hierarchy for
me and modal actually follow as layout
pretty well in the end it can output
proper graphic design poster for me with
some special layout like this triangle
shape which is not something that super
common it will get one shot by itself.
Those downside I found is that once you
do use ASKI it tend to make the UI a bit
too simplified cuz in ASKI there's no
easy way to indicate like this font
should be bigger than the rest. So the
content hierarchy does feel like a bit
too simplified but I feel like with some
experiments we can either keep ask
Yframe as right abstraction level or we
can figure out some new level of
abstraction to communicate layout. So
this is the first step of layout
alignment and second step of flow is
same. So same including things like
Theme
color font shadow border radio all sorts
of things. This is probably the biggest
and easiest leverage you can get to make
a default AIish UI into something that
feels really personalized onto your
branding. And there are multiple ways
for you to get the style right. You can
either go to dribble mob or any website
to get some UI reference and just copy
the image over and ask cursor or super
design to extract CSS stylesheet from
the UI mock. But generally I found if
you start from mock up it normally get
to like 80%. It's almost never look like
100% similar. That's where a platform
like Twix CN is really really useful. So
Twixen is a platform that really just
focusing on scene design. So you can
come here, change the color, font,
shadow, border, all sort of things to
create very different and unique style
and this is where your human taste comes
in to create something truly different
things like font where have really big
kind of impact of the design as well as
the primary colors and they provide this
type of UI for you to play with the
style and once you get the style right
you can click on the code button and
just copy the stylesheet over to cursor
or super design and they will just try
to replicate the same style for you.
What you find is that once you have the
style confirmed, the UI quality just
became dramatically better. Like in this
example, this is what I originally got
from cloud. With some style change, I
can make it look something like this,
which is really different or high
quality compared with what you normally
get from AI. In super design also
streamline this process of same
generation as well. So after confirm the
layout of UI, it will generate a list of
stylesheets which I can preview to see
what kind of style it will be and if I
don't like certain style, I can ask to
generate again until I got something
that I really like. The point here is
that you do want to allocate certain
amount of token to just designing the
scene and making sure it produce
something that looks like what you want.
Again, this is one of the key factors
that will make your UI dramatically
better. Last but not least, animation.
So sometimes certain UI feels really
good is not because just it looks
better, but also it has like micro
interaction sync through like inline
Animation
editing with a nice style already, the
nice hover effects, the sliding and
slide out interactions and make UI feels
from good to great. And I find that you
can actually very easily just prompt the
agent think through the key user
interactions and animation design. I
will try to get it be concise and just
communicate and represent animation in
simple format like this which is what
type of elements need to be animated.
What are the key frames and when should
be triggered. I found even as simple as
this. It already give model a good
amount of context to know that they need
to consider those interactions when they
build a UI. And there are some probably
more advanced things you can do as well
like ask to generate a user flow of key
interactions in mermaid chart. A mermaid
chart is type of graph representation in
format like left side. Surprisingly
large language model is really good at
understanding those type of mermaid
chart and it can also go a bit more
advanced as well to like really list out
all the interactions into things through
but those are probably more useful for
some complex projects. For most of
project you can just go as simple as
just ask a model to sync through the
animations and spit out a key frame like
this. And what's really cool is that
once you spend time to get one component
right then you can scale to all the
other UI components you want and build
together a page. For example, here I got
this probably listing card that I'm
pretty happy with. Then I will just
prompt cursor or super design saying
great. Now help me generate another view
which is calendar view to help people
book inspections. With that prompt again
it will confirm my layout with me. Then
design styling and animation and in the
end I'll put a calendar component which
actually looks pretty good. It has same
set of styling and interactions. And
after that I also ask to generate map
view. Then generating me this map view
with same button content style and
animations as well as the price history
product
card that I can chuck into the property
detail page. So you can imagine you can
just keep going build out whole UI
components and give all those things as
context to model say now put together a
page for me with all those components
and those are just flow steps I have
experienced so far for past few days.
There are a lot more things you can also
experiment on your end to figure out
which part are actually helping a lot in
terms of output. Meanwhile, also baking
this workflow in super design extension.
And if you don't know super design, it
is open source project Jack and I have
been building. It is basically a cursor
extension that you can just open inside
your IDE to start generating UI. It is
totally public and free to use. It will
firstly propose and generate the layout
and then it can generate the same and
when we have some kind of nice UX for
you to just preview the same here and
you can ask it to iterate multiple times
and in the end it will pull everything
together and you will have this kind of
infinite canva directly in ID to preview
all different variations of the UI in
the same screen. But if you want to
learn more in depths about this kind of
fourstep UI flow, I actually articulate
those into a prompt that I normally use
for cursor cloud code and super design
in the AI builder club which is a
community I have building where we have
group of top AI builders who are
launching and building AI products.
Myself and other people were just keep
sharing some in-depth learnings and
workflows of how to build and launch AI
products where I have some instruction
about styling icons scripts and the most
importantly is a workflow here. I asked
it to follow this workflow of layout
design, scene design, the core animation
design, then generate the actual UI with
more detailed breakdown example which I
initially just copy those prompt and
create a custom mode in cursor or cloud
code almost immediately gets better
results. So if you're interested, you
can click on the link in the description
below. I'll continue to explore more
ways to make the UI generation easier
and faster and better. And if you know
any good tips about UI AI generate
design, please let me know. I would love
to hear. Thank you and I see you next
