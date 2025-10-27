Intro
this video is sponsored by hadong one of the best open source platform for logging monitoring and debugging your
large L model applications today I want to show you how can you make your cursor workflow 10x more effective to build
production level application with much less arrows if you don't know what cursor is it is the most popular AI code
editor that everyone is learning it enable anyone even 8-year-old to be able to build fully functional application
using just natural language and we saw many wild example just form past week all around internet where people
showcase beautiful application that they have been building with cursor but the moment you start building with cursor app yourself you probably start
encountering countless arrows and very hard guessing actually up running and if this is your experience the good news is
that there are many things you can do to actually dramatically improve the success rate for example instead of giving cursor a simple instruction to
build out the whole web application you actually need to learn how to write the best documentation to communicate and
align with cursor what are core functionalities how does n file structure sure look like including code
examples and list out all the dependencies or it might be a bit unclear of which text tack that you
should be using and how does cloud VZ and cursor fit together into a cohesive
workflow and when to use which one with all those tips and best practice workflow I was able to dramatically
improve success rate for my own purs so I'm going to show you step by step what does my workflow look like so you can
replicate and build your next dream app and the example application I want to show you how to build today is a really
interesting AI analytics platform called Gummy Search it basically utiliz what what lar L model is really really good
at which is reading through thousands of unstructured redit posts and summarize extract key information like what kind
of pinpoints people are struggling with and what kind of opportunities might be for solutions that people are asking for
and I learned about this app from one of the Greg's video where he showcased how he use Gumi search to find startup ideas
which I highly recommend and what got me really interesed in to use this as example is because getting large L model
readings through huge amount unstructured data and extract insights can be us utilize for many other data
source apart from just rdit like you can probably build application for Twitter Facebook group Discord or even private
data source that you might got somewhere else so to hour showcase how can you use cursor to reute such social media
analytics platform where it can res thousands of posts and summarize and extract key information for people to
find Opportunities with a full backhand setup as well as integration with large language model monitoring platform so
you can optimize cost so let's get started so to get started instead of jumping into cursor Direct ask you to
Step 1 - Plan & Prep PRD
build something out we need to do some planning the first thing is we want to scope out a little bit about what kind
of core functionality we want to ship my process is to spit out a core scope the application has to have to be useful now
do some quick research maybe talk to chbt to understand what kind of like package that I can use for core
functionalities in the end I would get cloud or 01 model to design the project structure folder so that I can plan
ahead based on all the requirements I have and then write out the detail requirements so in order for a specific case I will create new GitHub report
called Reddit analytics platform then I will start creating a instructions. MD
file and normally I would start with a file structure look something like this I would give a Pur overview and then
start spit out the cool functionalities including documentations of package that we're going to use and current file
structure so that I can ask 01 model to plan a little bit so in your case you can probably follow very similar structure especially if you're building
a web application for project overview I'll just give a brief description that you are building a Reddit application
platform where users can get antics of different subreddits where they can go and see the top contents as well as the
category of posts and you will be using nextjs 14 chassis in Tailwind Lucid icon
and in term of tax stack so nextjs is just one type of Frameworks that we are using similar to react and chassen is a
UI component library and telwin is a CSS Library where it will make a code more
easier to understand and Lucid is icon library that we can use but if you want to use other component Library you can
just change it here and then I'm going to start flashing out core functionality this is probably the most important part
I basically want to think through what are the core functionality that this app has to have in my case if I use Gummy
Search as the reference we need a page to actually view all the subreddit available and user can create a new
subreddit if they need and then we also need a part to revew all details for specific subred and from my experience
the most useful part of Gumi search is the same where I can see the top content as well a category about which post
where people talk about solution request which post they talk about P anger and something we can even do more than gumy
search is that sometimes I have very specific type of post that I want to find so I want to enable people maybe
add a new category as well so in my case I would have a few different functionalities one is the ability to
see the list of available subus and add a new sub Rus and it need to display a sub page uh and we also need to Fat post
data in the top post tab as well as using open AI to analyze the post data into different category SS and in the
end a bonus point to add new SE category and what I need to do after I basically just need to spit out all the detail
interaction that I can Sy of if this is your first time writing detail product doc it probably take some time but it
will be worth it so in my case I will write down the details that user can see list of available Subarus that already
created displayed in cards common ones like AMA and open AI and users can click
on add a Reddit button which should open a model for user to paste in Reddit URL and add and after user adding a Reddit a
new car should be added and in subreddit page uh clicking on each subreddit should go to Reddit page with two tabs
as well as other details that you can pause the video and type out later and after this core functionality next thing
we want to do is to find the libraries and packages that we're going to use to build out some functionalities so there are two type of documents I would need
to include one is the code example for how do we get ready Reddit data so there are few ways I can go the easiest way is
that you can go and ask chat gbt especially for functionality like this one where reditor is not new SC you
should already have training data about how to implement things for Reddit so I can just go and ask I'm building a web
app using nextjs for fashion Reddit post data what is best package to use then I can say give me answer where snow wrap
seem to be one of the best package to use and then I can go to npmjs.com to search for that specific package so mpm
is like the package man manager which we're going to use to install this package later so in here it give us some
examples and also link to the detailed documentations which we can take look to get more details and one thing I would
normally do is I would start un cursor to give it documentation and try to spit out some proof concept of this functionality that we want so I will
just copy this one go back to cursor open the cursor composer and then I addm
uh doc where I can click on add new Doc pasting the uh link here so it were
adding the documentation of the snow wrap I will confirm and then here I will give a specific instruction help me
build a simple typescript file of fing recent RIT post data from past 24 hours under orama including title content
score number of comments and date using snow rrap so you can see it start creating example uh script so I can
accept all and the first thing is I will need to get the redit API credentials so you can keep asking it about like how do
you get uh Reddit API credentials but you basically go to reddit.com preference SL apps and then you can
click on create another app and give a name so in our case I call Post categorizer and I want to choose script
description we can put an app that analyze Reddit posts and about Ur you
can keep empty redir URL I will just keep Local Host 3000 and click on I'm
not robot and create app and now you will get a credential here so I'm just going to temporarily replace a
credential and the user agent you can just put it whatever client ID will be the tag
here and the secret ID will be this one and here it ask for the refresh token as
well by remember snow wrap off a few different ways to oos I just want to make an easy one which using the
username and password so I'm going to copy this one and replace the refresh token to be username and password where
I can putting my username and password in next is I want to install mpm so I'll
copy the command line in terminal and then do TS node fash RIT post. TS Okay
cool so you can see that it does return actual post data back so this code
example is actually working and then I can just copy paste this thing as a code example and again just taking away
another layers of potential arrows from this process by doing some research early on so what I'll do is I will copy
this code example in and go back to the instruction. MD and put example here says documentation of how to use snow
wrap to fetch RIT post data so code example and paste this in and now we
also get description that we will use no RP as a library to fetch Reddit data and I will basically do the same thing as
documentation for how to use open AI structure output to categorize the RIT post as well so our go to open AI
documents copy the link in go back to cursor add a new one and add Doc and new
one paste in open AI structured output confirm and here I would say instruction
help me write a simple typescript to categorize the RIT post it should have output post category analysis where it
has bodan value bodan basically is like true and false value for each category below solution request P anger advice
request and money talk so I will click enter so it create a simple script for me and I can just come here and
temporarily replace the API key here I do notice the code here is actually not using the structure output so I'm going
to actually give a very specific example uh that I get from the documents and
this is kind of another reason why I think this type of in Advan plan research is necessary so I would just go
back to cursor and then say I want you to use the open AI structured output
function use example above as reference to refactored code uh and uh if I come back out you can see that it used the uh
structure output now even though the model is wrong so I will change this to be 40 mini but I will also just do some
quick updates because I don't really like the structure I wanted to put a description to actual Z data type here
here instead so I can just choose this part of code so I can just go back to cursor composer and I want you to set a
description of each category to zone model itself instead of part of prompt so later it'll be more flexible if
categories change okay now it should be all good so I will open Terminal mpm install open and zot and then do TS node
categorize post. TS okay I got this Arrow okay looks like it didn't add the
beta here so I'm going to paste in the beta according to the documentations
okay another problem I found earlier was that type script have very strict return type and previously the return type was
defined ex result type we defined earlier but the actual thing we return here is string so I just remove that and
we can run again cool now you can see it returned this result po play so this is also example we can include into the
instruction so our add documentation for open AI structured output code example
and I can also include the example output and example response and at top I update uh using open AI structure output
functions so this pretty much the Croc of the initial draft the last thing I want to do is I want to include the
current file structure to do that I will first need to set up the project so to set up project I can go to chass in they
have pretty good command line I press in npx chass in at latest initial and it
will ask me whether I want to create a new nextjs project first I will click Y and then give name Reddit and Antics and
I will choose a New York style natural uh yes then all the project has been created publicly so you can see a
project folder has been created uh what I want to do is that I actually want to
First create a folder inside this project folder called instructions and move this instruction MD under that
folder and now I do cursor Reddit analytics so this will open cursor in
that specific folder uh if you don't have this cursor command line yet you can command shift p and then select this
shell command install cursor command otherwise you can always just open that specific folder from here but now I'm
going to this specific uh project folder and then open the instruction that we created earlier so let's firstly install
a few different packages that we know we're going to need so mpm install snow wrap open Ai and z and next thing is I
will create a new file called EMV do loal where I will add all the credentials in and also do MPX chassi in
at latest app so at default the components from chass in one be automatically add in so I'm going to
manually select the ones that we know we're going to need like badge card input label sheet table tabs and enter
Then you can see the components has been added then we need to add the current file structure in so we'll firstly do
Brew install trees so this is a library that going to get a snapshot of a current file structure so if you just do
tree it will return the whole file structure which is not exactly what we need instead I would do tree- L which
which means we would go just two layer down which should be enough and then - I which means ignore so we don't want to
include node module file so now it will give me a clean file structure here uh
and I will copy this in Reddit analytics and then paste this file in to indicate
what does existing project folder look like so now what we have here is a pretty decent starting point of the
product requirement dot but that's not it to actually get a cursor produce really good result with less and less
Arrow I actually want to give it initial PRD to 01 model or Cloud uh to design
what does the final Pur structure should look like what kind of dependency Z will be and write out the final PRD to fill
in all the details I personally found 01 is really good at writing and filling those detail docks what I would normally
do is copy the existing Pro requirement dog paste in here and then add a bottom and above is a project I want to build
how should I structure my project file try to create as few files as possible because I found when you have less files
cursor tend to have less arrows and click enter so you can see the O Model start syncing through a few different
steps and then spit out a project structure file based on the requirements and after that I will give the Second
Step help me adding details to the original PRD that give clear alignment to developers who are implement this
project so don't create actual code just a PRD including file structure in the doc and all documents provided with both
example code and response those are important context and click enter again o1 model will start singing through a
few different steps and spit out a very detailed instructions of how this project should be created as well as
updated Pera structures and code examples in the end it will give a very detailed breakdown of all different
components okay great so this is really decent product requirement doc uh the only downside is you can't just copy
paste in because it's not in markdown format so normally what I do is I go to Cloud paste this in and then say help me
convert this to markdown and then Cloud will break that down into specific markdown files that I can copy paste in
once this finished I will just copy this and paste into instruction. MD and save
okay so this file should give cursor quite good amount of alignment so now I think we are pretty much ready to start
getting cursor Wan so only last thing we want to create aemv local file and putting the credential of Reddit and
open AI here and now let's get cursor to start implementing this project but before we diam I got a lot of DMS where
people asking for more indepth tutorial of utilizing AI to build fully production ready applications and that's
why I started a community called AI Builder Club where I'm spending lots of time every week adding really in-depth
content of how can you use AI to bring your next startup ideas life it includes step-by-step tutorial of how to build
real world use case with AI where our share best practice prompt and code example that I use in every single
project and you can just copy paste case plug and play as well as some ready to use template for some common agents that
you can build and most importantly you can go and post challenges and questions that you are experiencing in the
community me or other community members will normally jump on and answering you can also see some secret tips that other
AI builders in the community have tried and worked well for them if you think this is interesting you can click on the
link in the description below to join and now we can start getting curser to build out this application using the
fully flash out documents so I would do command I open cursor composer so let's
Step 2 - Build frontend
give instruction let's build a RIT analytics platform based on instruction let's firstly build 1.1 view available
subreddits enter so you can see that it will create files in all the right plac
and I click accept and we can try to run this by doing mpm wrong dep okay great
so we can see that the homepage already created listing out all the sub Rus available next let's build 1.2 adding
new sub Rus so Crea new components under the components called add sarus model
and it also ask me to add in those new components I believe I already added oh but looks like I didn't add the dialogue
okay so I'm going to do npx chass and latest add dialogue now if I go back to Local Host 3000 I can see this new
button called at subreddit if I click on that uh you can see the UI is a bit broken but we're going to come back to
UI later first thing we just want to making sure everything works so the functionality of adding sub seem to be
there and next we're just going to move on to the subredit detail page navigation let's view the next part of
subreddit detail page navigation so it will basically create pages and files
based on the predefined structure so if I go back to Local Host and click on the specific Reddit page you can see it
navigate to that specific side page then I will ask you to move to second part adding the tabs great now let's build
next part so you can see the beauty of predefined the product requirement doc like this is
that you basically break task down into small steps that the cursor can take very well and I will accept all so if I
go back to the app and click on this it will open the two tabs here as well and again I'm going to ignore the UI and
just finish the functionalities so I'm going to give instruction now great
let's build fashion RIT post uh 3.1 data retrieval so this should create a few
different files and I will just click accept all and refresh the page here you will see there are looks like there's
some arrows in terms of the modules so I'm going to paste the arrow into the cursor and help me resolve this Arrow so
we might need to install this two uh libraries or just go to the other terminal install and I'll accept all now
I can actually display the post great now let's build 3.2
okay after this looks like no content is displayed so I'm going to go back I can see loading posts show up briefly on UI
but later it disappear and no post are displayed on the interface help me things through the root cost Ling step
by step so first say try to add some additional logins or accept this it looks like it says no post F which would
be weird my guess is maybe the API is set up incorrectly so I can go to
libraries rdit dots and give feedback uh it says no post found CU this because
Reddit dots is not set up properly okay so it looks like the problem is that the
client side versus server side where the rdts file was executed on the server
side but the separ r tabs component is client side component so solution here is that to get the data flow from server
side API to the client side components given this observation here are the potential root cost the client and
component might not be able to make a service side API called directly so the solution here is it creating new API
route to fetch post so now all the post has been updated poply and what I would do is I will quickly come here and then
submit a commit set up project and fetch redit post commit so I going back to the
cursor composer and also this is fashing RIT post now next based on instruction let's build the 4.1 post
categorization uh I will accept all and go back to this page refresh okay so
looks like here is Arrow I'm going to copy this arrow and uh add to composer help me identify root cost and resolve
this issue let thing step by step accept all okay and next is I wanted to display
categories as well so I would say next let's implement this 4.2 display categories okay so looks like this one
issue that there's no actual categorization displayed so I'm going to go back cursor and then giveing
instruction back if categorize post and point actually
working okay if we go back to the reddits you can see again the end point
here of open AI is not exactly what do we have in the instruction so I need to be more specific I'll go back to the
instruction copy paste the code example or accept all first and then add Reddit
TS paste the file in the categorized post function is not implemented correctly it has to be based on
documentation we provided in this instruction file please refactor the code so accept all and I want to change
this model to to be 4 uh mini and I still observe a few uh kind of weird part for some reason it just keep
ignoring some specific part like beta so I just need to manually uh copy paste
over those things and Okay cool so you can see that the category has being show
off properly for each post if I go to SS I can click on each card and the relevant post will be displayed here
great so I'm going to add it commit again uh categorize posts ready so you
can see the core functional is implemented here I can see the top post I can also go to seams page future out
post with specific categories but for anyone who is launching large L model based application you all got a new
Step 3 - Connect LLM monitoring platform
problem that you need to worry about which is how do you Monitor and alert the large L model usage and whether or
not you optimize the cost structure there can really make a difference of whether your business succeed or not I give you one example a few months ago I
launched a AI girlfriend and back then I offer a 60 seconds free Tri chat for
every single user lots of people sign up but somehow I just never make money from it so I manually Implement a bunch of
tracking to understand the cost structure there and later I realized for the 60 seconds free Tri if I have 1%
conversion of all the users I need to charge at least $13 from each user to break event so it's really a balance
between the performance cost and speed and the same case for this radit analytics platform we kind need to
understand what is cost of every single large Lear mod call to together those categories and how many post do we
normally have under one separ Addus that's why I normally were set top integration to large lar model
observability platform like hadon so if you haven't heard about hadon before haacon is open- Source platform for
logging monitoring and debugging lar L model applications where they give us ability to see exactly how people are
interacting with our large Lang mode application track the cost arrows and latencies so that we can optimize for
the performance and I can also do a bunch of very Advanced interesting things like automatic caching the
response if the promp is same to to save the cost and improve speed send customer properties so that I can segment
different type of requests and many more and the best part is it is extremely easy to set up so if you are calling an
open AI model like me all we need to do just adding this base URL and additional headers from our open AI clients and
that's pretty much it I can just copy this over and go back to cursor open the rit. TS which is where we make open Ai
call and paste this in and add this environment variable headon that is pretty much it so now if I go to the RIT
platform and open a subreddit after I get this response and it will automatically track that we made 200 lar
mod request for that specific subreddit and that probably means we processed around 200 posts and those requests are
from the same user basing in Australia which is me and total cost around 1 cent so that now I know the cost to onboard a
fairly popular new sub Rus is around 1 cent using the GPD 40 model and I can go
to request to see the detail of every single requests as well as the actual
prompt that we send to open ey and immediately I can spot the problems in my prompt for example the structure now
is actually not very clear what are the actual post content because some of content looks like part of prompt and
this might confuse lary model so I can immediately improve the performance by updating prompt here and save but on the
other side you also have a URI that allow me to experiment with different prompt directly and also switch between
different models and for each data while I'm reviewing that I can add this to a data set called bad sessions and this
allow me to create data set that I can use to either evaluate the new model or ply or F tune the model so I highly
recommend that you set up your L mode application with those logging and morning platform and headon is one of
the best one I have put the link in the description below for you to try out headon for free after we connect this to
Step 4 - Connect Supabase
Helicon the next thing is we want to set up the back end so we have the core functionality kind of implemented for
this RIT analytics platform but Annoying part now is that every time when someone click on this subr page it will refresh
all the posts and then going through the open AI to analyze and categorize posts which is not optimal and going to cost a
lot of money so what IDE I want to do is that when someone open the page and fet the data for the first time I want to
save this data on a database so that next time when someone else open this page we can check what is the last time
we fin the data from Reddit if it is within 24 hours let's not update again
so to do that we actually need cursor to implement a kind of new functionality to save the data somewhere I want to
showcase this because this is a great example to Showcase how can you add new features to exist pures they already set
up so to do that instead of just open cursor and ask it to implement the whole project I will actually open the side
panel and add codebase so this is really powerful feature where cursor actually
allow us to reference the whole code base and I can specify certain files to include and exclude for example I
probably don't want the node modules folder so I put node modules folder by the way I don't know if putting the
folder name going to work but I just going to put it here uh if you know the answer please comment below let me know and I'm going to put detail instruction
so I have this project build based upon the original instruction but currently we need to fetch R data and call open
API every time when someone open the subr page which is not optimal I want a backend engineer to connect it to super
base and save RIT post data and AI analysis data to superbase and only fetch data if the last update time is
older than 24 hours ago help me generate detail stock that can help back and developer understand this project
structure what cool parts to build for super base integration that compatible with this current project structure no
need to include actual code example just the design do by the way if you don't know what superbase is super base is
open source project that offered complete backhand for both mobile and web application it was introduced back
2020 and got popularity very very quickly because before super base you basic have two options for building
backand one is Firebase another is a WS amplify they both kind of works but problem is it kind of lock you into
specific vendors which is not optimal that's why super Bas grow so fast because it allow you to build backhand
and host anywhere you want and they provide full backhand service for database authentication storage and even
Vector storage now and offer front and SDK to connect to the backand very easily and if you haven't buil any kind
of backand feature before it might feel stunning but it's actually easier than you saw what you really need is kind of
Define what kind of data we actually need to store about your application for example in our case you probably always
want to have a table for profile so that we can track the users you can even add things like tier to tracking the pricing
tier how many credits they left and strip customer ID and subscription ID if you are building the payments into the
platform as well as sub ratus so we want to track the list of different Subarus and the last updated time and list of
posts for each post we want to track title content scores and list of categories so you can basically think
them as spread sheets what kind of sheets you need and what kind of columns you need for each sheet but if you don't know what specific columns that will be
needed don't worry you can ask AI to help you figure out so go back to cursor so first thing I will do is I will open
Terminal and get file structure uh so I will use the same command but this time I will use three layers deep so this
will give me uh the latest file structure and I'm going to copy this over and I'm just going to the
instruction. MD and update the file structure here and then I'm going to copy this over to the instruction on the
right side and give instruction I have a project built based on the instruction. MD but currently we need to fast red
data and call open API every time which is not optimal I want a backend engineer
to connect to super base save each separated data to super base and only fetch data if the last update time is
older than 24 hours ago help me generate detailed documentations they help backand developer understand project
structure what a cool parts beautiful superbase integration that compatible with current project structure and what
database should we create and what optimal schema should look like let's sync step by step and I actually want to
use 01 preview model here directly and click enter okay now it return back a
very detailed documentations where it talk about how the data currently FL it also show me the actual database schema
design and data fashion logic as well as detail steps so this is really good next
thing is actually want to convert this into a markdown file then I can get cursor to refer to so I'm going to copy
paste the hos thing and go to cursor help me convert this into proper
markdown format okay great so I can copy this over uh go to instructions folder
and create a new one called superbase setup. MD paste this is in and we do
need to update one part which is the file structure I will need to copy the latest file structure into here and Save
and before we get into cursor we need to do a few steps firstly we need to install uh super based client Library
our open Terminal and paste in and then next we can start using cursor composer so I'm going to open cursor composer and
then say we need to implement super base integration for this current Project
based on instruction here super base First St to initialize clients so enter
so you can accept all and next it will we need to add the credential into env. loal and to do that we need to set up
the superbase project first so I'm going to go to super base and create new project I'm going to give a name edit
analytics and give password okay great and after the
project created I will go to Project settings and API then here we will get
the credential we need one is URL another is service row credentials and after that we will need to create the
two database table as well so there are two ways you can do that either you can go to table editor and create a new
table uh by just typing the name of table and adding the colum based on instruction or we can actually go to
cloud and then give instruction give me the SQL command to create all tables in
super base directly then it will give me this SQL code I can copy and go to the
SQL editor paste it in and then run okay and after it's running you can go to table all those tabl should be created
already according to the instruction so I'm going to uh give the instruction grid I've set up superbase project table
and add environment variables now let's do next step to initialize superbase client and modify the data fashion logic
and I'm going to copy paste the specific part into here as well and click enter so I'm going to click accept all and
then do let's do step six update PR now and accept all uh and the next step now
let's test data flow okay I can see I got a few arrows so past those arrow in
got this Arrow after loading sub page and accept all okay and thanks for the
log before I can see that we successfully fashed data from Reddit but got Arrow actually upserting data so it
says couldn't find advice request okay so I guess probably reference wrong scheme even though it is including in
the doc so this time I'm going to be more specific copy paste actual specific scheme in and then copy paste this arrow
in I got this Arrow seems fail to push data to super base please refer to the
actual sub red to actual tables and schemas we set in super base let think
step by step yeah save this and if I refresh again I got another arrow so so
I'm going copy paste in I go this Arrow after updating TS okay and our accept
and we got another arrow here related to super base so I'm going to copy paste in
and enter so it says that duplicate key Arrow as well as category is not defined
so it is fixing those ones okay cool so I can see the post has loaded and uh
there are also uh post created sub loaded as well as uh post categories
however I do get it arrow and looks like the issue is that for some reason it
kind of F the data twice so I will go back to cursor and then copy paste this
in everything seems working now I can see data stand to super base the only issue is that it seems that somehow we
fetch dat twice after initial fetch succeed this letter Arrow I pasted what could be the root cost okay great so now
I can see data is loaded poply on the front end and if I quit this page and
coming again you can see dat load much faster because reading data is from the super base the only issue is that the
comment data didn't seem to be loaded create ad data is not loaded the category is also not loaded so I'm going
to go back to cursor so here I will give instruction that there are some issues for top right post command created
category data then seem to load down front end and for Sims no data is loaded too but I can see in super baseer data
exist what could be the ru cost okay so it give me answer but for some reason it didn't really update the file directly
so I'm just going to manually copy paste in so you can just copy this function name go to search uh and then you will
find a specific file so we need to update this part I'm going to update
this part as well as the return value so I save this and refresh okay so you can
see the comments data and the create data has been displayed properly the only thing is the category data still is
not pulling through and let me just double check I do think the post categories are create pop so I will so
give instruction great the created and commands data are displayed now however
no category data is loaded what could be the ru cost help me Sy through step by
step and what I also probably do I would just copy paste the command we have
about the schema above is the table details we use to create uh super based
table as reference so I say so I pasting the actual SQL that we use to create
table to give it more context and then tell it to uh no category data is loaded
what could be root cost help me Sy step by step and above is a reference okay so it ask me to add in uh the debuging for
so I just add it and then try to load the data again so I can see that the
post category looks something like this so I tell it post category looks like an
array of object our pting like this okay great so everything is working now uh I
can see that it's added to super base and I can go back and click again data
will be loaded instantly but if the first time I open something it will load the data and sync all the data to super
base so this actually how you can build a new feature on top of project that already exist and the last part I want
Step 5 - UI Touch up
to show you is how can you make your UI looks a lot better so I'm sure you definitely heard about vzer which is
kind of generative UI platform introduced by versal a lot of people are talking about it but it might be not
super clear to you about when should you use VZ for my experience you can basically use cursor to build out the
functionality of your application and in the end you can go back ask v0 to make your UI looks a lot better and it's a
lot easier than you saw I will show you how so I basically ask v0 to help me update UI Page by page for example I
will go back to my app and choose page. TSX which is kind of like homepage where
I display all the Rus and what I would do is I will basically just go to vzer and paste in the page. TSX and then I'll
give instruction I'm building a RIT analytics platform above is homepage displaying all the sub R is available
please keep the functionality exactly like above but make UI a lot better remember only changes UI do not change
functionality and variables so I will click enter what it will do is that it will St spit out the UI it might give
you some error but you can ignore that I will just come here and copy paste this code and go back save you can see the UI
looks a lot better and different so this is basically how we going to update UI we basically just need to change things
bit by bit so next thing is I want to update the add subreddit button so now I'm going to go back to components and
let's change as SE model button so I'm going to copy things in above is seated
model and button and again I'm going to uh copy the same uh kind of code same
prompt here please keep the function at exactly same as above but make UI a lot better and once it's finished I'm going
to copy this over paste in okay one thing I did try again is add this part
making sure the same style as the previous page you created so that things will be consistent uh all right I will
copy this in save okay so now you can see the button is also in the same style
as well if I click on that it will give me the kind of dark mode model and next thing I want to change those uh cards
that display in the subreddit as well so I will go to subreddit card basically do the same thing copy those over and I
just copy exactly same prompt okay so the card has been created uh I can copy this paste in uh great now the style you
can see is the same as everything else on the platform next I will go to the subreddit page and there I will firstly
go to the Subarus page and paste it in and use the same prompt and give
instruction great above subred page displaying detail of this subed analytics uh and enter okay once this is
finished even though it shows Arrow here but I'm going to ignore that and just copy this paste in here cool so you can
see that the overall structure looks more and more similar we only have a few
things left subred tabs um copy that in and paste over okay still look a bit
wrong but I will just copy this code over and uh go back to cursor save it uh
and go back here okay it actually does look pretty good it kind of blend into the dark mode same overall um the next
thing I want to do is that I want to update table so I will uh go back to the
post table copy this and paste it over nice so it looks a lot better now with
the right color scheme and the Addison icon as well obviously you can promp it
further to get the right style you want I'm just going to move on to the last part which is same card so paces and
paste in awesome so you can see that now the UI is a lot more flash out than before and everything looks a lot more
cohesive and obviously if you don't like a style you can prompt V Zer to change style as well but I would suggest you do
at very beginning so this is how you can set up a fully functional web app with
beautiful UI and backand setup the last thing is that we actually want to bring this app live so the rest of world can
see it and to do that we're going to use Verso which is company behind next JS and they made it deployment a lot easier
uh so you can basically go to Verso create account and choose this purchase GitHub repo and going through a
deployment process which normally involves some kind of debug process as well I'm not going to go into details
and if you want to learn details about how do you actually deploy the web app Val versal you can check out the other
video where I dive deep into every single step that's needed to put your app life I've put that link in the
description below so you can check out so this is some of my best practice workflow of how do I use cursor to build
fully functional application by creating very detailed documentations I hope you find this useful I highly recommend to
try out and even build some kind of more advanced function that maybe chat with this redit data and if you want to learn
detail things like how do you build user authentication with cursor and how do you connect to stripe so that you can
charge different pricing tier you can join my community AI Builder Club where I share a lot of tips and detailed
prompts and code example of how to build AI applications and each one of them has my best practice prompts that I
personally use for every single project where you can just copy paste Plug and Play plus you get to connect with other
AI Builders who might already experience problem that you are facing right now so you can click the link in the
description below to join my community today I hope you enjoy this video I will continue sharing interesting a Pur I'm
doing so please like And subscribe if you want to keep update thank you and I see you next time
