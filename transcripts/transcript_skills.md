Claude.
Just introduced this concept called agent skills.
It might look complicated, but it's actually really simple
ideas, but super powerful
And many things that it might be even bigger than MCP.
Claude code skill you can almost consider as a combination of both a
prompt instruction to teach agent how to do certain skills, as well as a list
of assets and tools like predefined functions, and templates, guidelines
To make it produce more consistent result
The two and assets are kind of optional.
It can be as simple as just one single prompt as well.
For example, for the brand guideline skill, it.
Literally just one single prompt, including very specific brand guidelines
that you want agent to follow.
Same thing here.
I also have a UI design skills.
There.
Just one single prompt.
So all the skills start with the Skill MD file including this short description, YMO
, explain to agent, when to use the skill.
And this description will always be added to the agent context,
So you'll know what type of skills it has access to and when
agent decide to call the skill.
This is where the rest of our context below will be loaded.
So this part almost feel like Claude code commence.
So skill MD is the most necessary part of skill
for more complex skill.
You can also include more resource.
For example, for this skill to generate algorithm art.
It also include resource, like example, implementation,
And get agent to raise those example, reference before it implement, to making
sure we have more consistent result.
But more importantly, you can also include some predefined functions
like in this slack give creator skill.
It already.
Import list of package and predefined functions
an instruction here.
Basically tell the agent how to use those functions to create a nice GIF out of box.
Why is better than MCP
and here's why I think skills might be even better than MCPs.
So MCP has been an awesome way to extend agent's capability.
By connecting agent with new MCPs, it can suddenly do new
things that I couldn't do before.
The problem is that MCP in practical is not that easy to use.
Firstly, MCP can consume a whole bunch of token that is unnecessary.
Because each MCP can contain a bundle of different tools and each tool here will
including the description about when to use this tool as well as input schema
And all those token will be loaded to agent context.
Regardless whether this is useful or not.
And more importantly, quite often, MCP builder will want to build the
tools in a more kind of modular way.
So it is reusable and more composable.
But that also means most MCP is not something you just connect and use.
You want to give agent more detailed instruction about the
order of when to use which tool.
And that may set up more complicated,
But on the other hand, the way skill's set up allow you to consume much less token,
perform much more complicated tasks.
Let's take Shadcn MCP as example.
At default, it has seven different tools for different purpose.
If I load the context,
You'll see.
Those Shadcn MCP tools.
Already take about 4,200 token.
But you can imagine if we turn that into a Shadcn skill, we can probably
reduce token from 4,200 to just 70.
And that means your agent can be equipped with many more skills.
And it should just work out of box because Skill MD can already contain
all the referencing instructions.
Without further due.
Let's show example.
So here under dot Claude slash skills, we have loaded a list of different skills
Example Skills
and there's a one skill called Slack-gif-creator which including
the description, the full details about how to create a gif as well
as some predefined functions.
So if I ask it to create a GIF for my slack around daily standup time
You'll see that it'll try to call this command Slack-gif-creator
with a custom prompt.
As I mentioned before, this skill is basically re used
the command infrastructure.
If you click yes, it'll start loading all skills here.
Then it'll create this Python code
and run this Python code
Which generates this GIF, it didn't look perfect.
But thing is that it's very easy for you to think about how to improve
this skill or pipeline by just improving those predefined functions.
There's another skill called algorithm art.
If I tell you to help me create animated zen style mountain algorithm art,
again, recall this comment.
it refers to create MD file to really design and plan the artwork.
It'll read the template file that we define here.
As example, reference.
Then it just generate this animated art.
Using P five js.
Meanwhile, another really cool thing about skill is that you can also start
Build skills for your own codebase
using skill for your own code base as a way to make agents self improving.
So here's how I create skills for my own code base.
So I'm building this Claude platform for super design and we
have this fairly large Monorepo.
And what I do is that I loaded the skill creator skill
inside the dot Claude folder.
So I can give a prompt.
We have the front end in this folder and also share package here.
Please go investigate our current convention, and tell
me what's the best practice.
For adding new UI component?
Great.
So it did a quite deep investigation and come back with the convention
Now let's create a skill called frontend, including all the best practice for
frontend implementation for code base.
Let's start with how to add UI components.
So it'll try to call the skill.
Initialising skill front end, which will be created here.
Include this file that generates general description.
Obviously you can update that also it start including those best practice
about our front end UI implementation.
It even create a further reference file for the component
guide, as well as style guide.
with this one,
Next time if I ask you to create new UI component, like let's create
a new UI component for emoji and image picker in our front end
it firstly, call skills to gather best practice and coding convention in our code
base first, and then start building things properly following the best practice.
So this is how you can use skill feature to really extend agent's capability
and make it continuously improving.
I just started this repo called awesome Claude Skills and moment.
Most of them is from official Claude.
But I start adding some stuff like UI design, which including very
specific prompt that I've been using.
And I'll keep adding new stuff.
Also, feel free to contribute and create prs.
and Meanwhile, if you're interested in dive into Claude skills more, I
would dive a bit deeper in our upcoming weekly workshop at AI Build Club.
So you can click on the link below to join if you're interested.
enjoy this video.
Thank you.
And I see you next time.
