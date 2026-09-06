# MIYEON — K-Beauty Trip Planner UX Design

## 1. Product Concept

**MIYEON** is a personalized K-Beauty travel planning platform for international visitors to Korea.

Instead of simply recommending individual beauty spots, MIYEON understands the user's:

- Trip purpose
- Beauty goals
- Preferences and restrictions
- Budget
- Available time
- Recovery/downtime tolerance

and converts them into a **day-by-day beauty itinerary optimized around location, time, treatment duration, and recovery constraints.**

### Core UX Principle

> **Tell us what you want to feel and look like. MIYEON figures out where to go, when to go, and in what order.**

The product flow is:

```text
Goal
→ Constraints
→ Beauty Profile
→ Spot Candidates
→ Filtering
→ Scoring
→ Location Clustering
→ Scheduling
→ Recovery Constraints
→ Itinerary
→ Booking / Navigation
```

---

# 2. Core UX Flow

```text
LANDING
   ↓
What’s this trip really about?
   ↓
What would you most like to improve?
   ↓
Conditional Beauty Questions
   ↓
What are you comfortable with?
   ↓
Budget
   ↓
Time
   ↓
Downtime
   ↓
Your Beauty Trip Profile
   ↓
Generate Itinerary
   ↓
Day-by-Day Itinerary
   ↓
Spot Detail
   ↓
Book / Navigate / Edit
```

The onboarding should feel like a short consultation rather than a form.

- One major question per screen
- Large visual cards
- Minimal text
- Clear progress indicator
- Immediate selection feedback
- Skip irrelevant questions automatically
- Target onboarding completion time: approximately 2 minutes

---

# 3. Onboarding UX

## 3.1 Landing

### Headline

> **Your Seoul beauty trip, planned around you.**

### Supporting copy

> Tell us what you want from this trip.  
> We'll turn it into a personalized beauty itinerary.

### CTA

**Plan my trip →**

Secondary microcopy:

> Takes about 2 minutes

---

# 4. Question 01 — Trip Purpose

## Screen

### Question

> **What’s this trip really about?**

### Supporting copy

> There’s no right answer. Tell us what you’re hoping to get out of Seoul.

### Options

```text
✨ I want a whole new me.

📸 There’s something coming up.

🇰🇷 I want the Korean experience.

🪞 I’ve never really known what suits me.

💆 I just want to feel good again.

🤷 I honestly don’t know.
```

### Selection

- Single select
- Card becomes selected on tap
- Optional auto-advance after selection

### UX Purpose

This question establishes the user's **high-level trip intent**.

The option:

> **I honestly don't know.**

is especially important because it allows MIYEON to take an expert/curator role rather than requiring the user to understand K-Beauty terminology.

---

# 5. Question 02 — Beauty Goals

## Screen

### Question

> **What would you most like to improve?**

### Supporting copy

> Pick up to 3.

### Options

```text
SKIN

FACE

HAIR

MAKEUP & STYLE

DETAILS

MY OVERALL LOOK

I DON'T KNOW YET
```

### Selection

- Multi-select
- Maximum 3
- Selected count displayed
- Example:

```text
2 / 3 selected
```

### Important UX Rule

`I DON'T KNOW YET` should behave differently from normal categories.

If selected:

- Other selections can be cleared
- MIYEON takes responsibility for identifying suitable beauty experiences

---

# 6. Conditional Onboarding

Medical/skin-related questions should **not** be presented to every user.

Only ask additional questions when the previous answers indicate that the information is necessary.

## Conditional Logic

```text
User Goal
   ↓
Does this require additional information?
   ↓
YES → Ask conditional question
NO  → Skip
```

### Example

If the user selects:

```text
SKIN
```

ask:

> **What kind of experience are you looking for?**

```text
Relaxing skincare

Professional skin treatment

Medical dermatology

I'm not sure
```

### If "Relaxing skincare"

No medical questions required.

### If "Professional skin treatment"

Ask only the minimum relevant questions.

### If "Medical dermatology"

Ask additional treatment-related questions when necessary.

Example:

> **Are you comfortable with treatments involving needles?**

```text
Yes
No
Not sure
```

This prevents onboarding from becoming unnecessarily clinical.

---

# 7. Beauty Category Taxonomy

MIYEON's internal spot taxonomy consists of three major parent categories.

## 7.1 Hair Salon

```text
Hair Salon
├── Color & Perm
├── Head Spa & Treatment
├── Hair & Makeup
└── Hair Extensions
```

## 7.2 K-Beauty

```text
K-Beauty
├── Color Analysis
├── Beauty Makeup
├── Nail Art
├── Permanent Makeup
├── Waxing & Hair Removal
├── Glasses
├── ID & Portrait
└── Aesthetics
```

## 7.3 Dermatology

```text
Dermatology
└── Skin Care
```

### UX Principle

The internal taxonomy does not need to be exposed directly during onboarding.

Users may not understand terms such as:

- Aesthetics
- Permanent Makeup
- Head Spa
- Skin Care

MIYEON should translate user intent into the appropriate internal categories.

```text
User Intent
    ↓
Beauty Need
    ↓
Internal Category
    ↓
Spot
```

---

# 8. Question 03 — Preferences & Restrictions

## Screen

### Question

> **Pick anything that’s off-limits.**

### Options

```text
NO NEEDLES.

NOTHING THAT RUINS MY TRIP.

I NEED TO BE ABLE TO COMMUNICATE.

NO SURPRISE COSTS.

NO FACTORY-LIKE EXPERIENCES.

DON'T SELL ME EXTRAS.
```

Additional option:

```text
NOTHING IS OFF LIMITS.
```

### UX Rule

`NOTHING IS OFF LIMITS` should not behave like a normal checkbox.

Recommended interaction:

```text
Nothing is off limits
[ toggle ]
```

When enabled:

- Clear all restriction selections
- Disable other restriction options

When any restriction is selected:

- Automatically disable `Nothing is off limits`

---

# 9. Budget

## Screen

### Question

> **How much do you want to spend on beauty?**

### Options

```text
Under $100

$100–300

$300–500

$500–1,000

$1,000+
```

### Important

This represents the user's **beauty budget**, not the total trip budget.

The resulting itinerary should expose:

```text
Estimated beauty spend

$420
```

The engine should try to keep the itinerary within the selected range.

---

# 10. Time

## Screen

### Question

> **How much time do you want to spend on beauty?**

### Options

```text
A couple of hours

Half day

Full day

I don't mind
```

### Scheduling Interpretation

Example:

```text
A couple of hours
→ approximately 1–2 spots

Half day
→ approximately 2–3 spots

Full day
→ approximately 3–4 spots

I don't mind
→ optimize based on itinerary quality
```

These are guidelines rather than hard-coded limits.

---

# 11. Downtime

## Screen

### Question

> **How much recovery time are you comfortable with?**

### Options

```text
None

A few hours

1 day

2–3 days

I'm okay with recovery
```

Downtime is an itinerary constraint.

Example:

```text
Day 1
Dermatology treatment
   ↓
Recovery
   ↓
Day 2
Color Analysis
   ↓
Day 3
Hair & Makeup
```

The engine should avoid placing treatments with meaningful recovery immediately before important travel activities when the user's preferences prohibit it.

---

# 12. Beauty Trip Profile

Before generating the itinerary, show the user what MIYEON understood.

## Screen

### Header

> **Got it. Here's what we're planning around.**

### Example

```text
YOUR GOAL

✨ A fresh new look


FOCUS

Hair · Face · Makeup & Style


YOU PREFER

No needles
No downtime
English-friendly
No surprise costs


BEAUTY BUDGET

$300–500


TIME

Half day
```

### CTA

**Build my itinerary →**

This step creates transparency and gives the user confidence that the AI understood their answers correctly.

---

# 13. Itinerary Generation

MIYEON should not generate an itinerary by simply asking an LLM to "make a beauty trip."

The recommendation system should operate as a structured pipeline.

```text
User Profile
      ↓
Candidate Spots
      ↓
Hard Filtering
      ↓
Soft Scoring
      ↓
Geographic Clustering
      ↓
Opening Hours / Duration
      ↓
Travel Time
      ↓
Recovery Constraints
      ↓
Daily Scheduling
      ↓
Itinerary Optimization
```

---

# 14. Hard Filtering

Hard constraints eliminate unsuitable spots.

Example:

```text
User:

Budget: $300–500
No needles
No downtime
English required
Goals: Hair + Face + Makeup
```

Candidate filtering:

```text
Needle treatment
→ REMOVE

Requires 2 days downtime
→ REMOVE

No supported communication
→ REMOVE

Outside acceptable budget
→ REMOVE

Doesn't match beauty goals
→ REMOVE
```

Only viable candidates proceed to scoring.

---

# 15. Soft Scoring

After hard filtering, remaining spots are ranked.

Example scoring model:

```text
Personal Fit        30%
Location Efficiency 20%
Price Fit           15%
Category Relevance  15%
Opening Hours       10%
Experience Quality  10%
```

Example:

| Spot | Personal Fit | Location | Price | Final |
|---|---:|---:|---:|---:|
| A | 94 | 82 | 90 | 90 |
| B | 91 | 96 | 72 | 87 |
| C | 86 | 90 | 95 | 89 |

However, the highest score alone should **not** determine the final itinerary.

The system must optimize the combination of spots.

---

# 16. Geographic Clustering

Location is one of the most important itinerary constraints.

Example candidate spots:

```text
Gangnam
Hongdae
Myeongdong
Seongsu
```

A naive recommendation system could produce:

```text
Day 1
Gangnam
→ Hongdae
→ Myeongdong
```

This creates unnecessary travel.

MIYEON should instead:

```text
Candidate Spots
       ↓
Geographic Clustering
       ↓
Gangnam Cluster
Hongdae Cluster
Myeongdong Cluster
Seongsu Cluster
       ↓
Opening Hours
       ↓
Treatment Duration
       ↓
Travel Time
       ↓
Daily Itinerary
```

The objective is not merely to recommend good spots, but to create a **good sequence of spots**.

---

# 17. Itinerary UX

## Main Screen

### Header

> **Your Seoul Beauty Trip**

```text
3 days · 5 experiences
```

Day navigation:

```text
DAY 1
GANGNAM

DAY 2
SEONGSU

DAY 3
HONGDAE
```

The day tabs allow quick navigation between itinerary days.

---

# 18. Day Timeline

## Example

### DAY 1

> **Discover what suits you**

---

### 10:30

#### 🎨 Color Analysis

**Personal Color Studio**

```text
📍 Gangnam
⏱ 90 min
💰 $65
```

↓

### 12:10

```text
🚶 8 min walk
```

↓

### 12:20

#### 💄 Beauty Makeup

**Korean Makeup Experience**

```text
📍 Gangnam
⏱ 90 min
💰 $70
```

↓

### 14:00

```text
🍜 Lunch break
```

---

# 19. "Why We Chose This"

Each itinerary should explain the logic behind important recommendations.

Example:

> **Why we chose this**

> We placed your color analysis before makeup so you can use your personal colors during the rest of the trip.

Another example:

> We grouped these experiences in Gangnam to reduce unnecessary travel between appointments.

This transforms MIYEON from:

```text
AI recommendation
```

into:

```text
AI trip planner
```

---

# 20. Transportation

Between spots, show estimated travel time.

Examples:

```text
🚶 7 min
```

```text
🚇 14 min
```

```text
🚕 12 min
```

A route/map view should also be available.

### Map View

```text
        [Spot 1]
            ↓
        [Spot 2]
            ↓
         [Lunch]
            ↓
        [Spot 3]
```

The map should visually communicate the day's geographic efficiency.

---

# 21. Itinerary Editing

The generated itinerary should be editable.

Each spot has a menu:

```text
⋯
```

Options:

```text
Replace

Move to another day

Remove

View details
```

---

# 22. Replace Spot UX

When the user chooses Replace:

### Question

> **What would you like instead?**

Options:

```text
Something cheaper

Closer to my next stop

More relaxing

More Korean

Higher rated

Different category
```

The replacement system should preserve the user's original constraints.

For example:

```text
Replace Spot A
        ↓
Keep:
- Budget
- Communication
- Downtime
- Beauty goals
- Day/time constraints
        ↓
Find alternatives
```

---

# 23. Regenerate Itinerary

At the top of the itinerary:

**✨ Regenerate**

When selected:

> **What should we change?**

Options:

```text
Make it cheaper

Less travel

More beauty experiences

More Korean experiences

More relaxing

More packed

Start later

Finish earlier
```

This provides a simple natural-language-like control layer over the itinerary engine.

---

# 24. Spot Detail

A spot detail page should contain:

```text
Hero Image

Spot Name

Category

Rating

Location

Price

Duration

Languages

Downtime

Treatment Information

Why it's recommended

What to expect

Booking

Directions
```

Example:

```text
COLOR ANALYSIS

Personal Color Studio

★★★★★ 4.8

Gangnam

$65
90 min

English · Korean

No downtime
```

### MIYEON Recommendation

> This spot is a strong match for your goal of finding colors and styles that suit you.

---

# 25. Spot Data Model

The recommendation engine depends heavily on structured spot data.

Each spot should contain at least:

```text
Spot
├── id
├── name
├── parent_category
├── subcategory
├── description
├── latitude
├── longitude
├── address
├── price_min
├── price_max
├── duration
├── opening_hours
├── booking_required
├── booking_url
├── languages
├── downtime
├── procedure_intensity
├── needle_required
├── tourist_friendly
├── factory_like
├── upselling_risk
├── price_transparency
├── images
└── rating
```

---

# 26. Beauty-Specific Attributes

Generic travel databases are not sufficient for MIYEON.

The spot database should contain beauty-specific attributes such as:

```text
downtime
communication
needle_required
price_transparency
factory_like
upselling_risk
experience_style
tourist_friendliness
```

These attributes allow MIYEON to filter and rank spots based on actual user concerns.

---

# 27. Recommended UX Architecture

```text
                    MIYEON
                       │
                       ▼
          What's this trip really about?
                       │
                       ▼
             What do you want to improve?
                       │
                       ▼
             ┌─────────────────────┐
             │ Conditional Questions│
             │                     │
             │ Hair → Hair Qs      │
             │ Skin → Skin Qs      │
             │ Face → Face Qs      │
             └─────────────────────┘
                       │
                       ▼
              What are you avoiding?
                       │
                       ▼
                    Budget
                       │
                       ▼
                     Time
                       │
                       ▼
                   Downtime
                       │
                       ▼
              ┌─────────────────┐
              │ USER BEAUTY     │
              │ PROFILE         │
              └─────────────────┘
                       │
                       ▼
               ┌──────────────┐
               │ SPOT DATABASE│
               └──────────────┘
                       │
                       ▼
                Hard Filtering
                       │
                       ▼
                 Soft Scoring
                       │
                       ▼
              Geographic Clustering
                       │
                       ▼
               Time Optimization
                       │
                       ▼
             Recovery Constraints
                       │
                       ▼
              ITINERARY ENGINE
                       │
                       ▼
          ┌─────────────────────────┐
          │ DAY 1                   │
          │ Spot → Spot → Lunch     │
          │                         │
          │ DAY 2                   │
          │ Spot → Spot → Dinner    │
          │                         │
          │ DAY 3                   │
          │ Spot → Spot             │
          └─────────────────────────┘
                       │
                       ▼
              WHY THIS ITINERARY?
                       │
                       ▼
             Edit / Replace / Move
                       │
                       ▼
                   BOOK / MAP
```

---

# 28. Core Differentiation

MIYEON should not position itself as:

> "Find the best K-Beauty spots."

Instead:

> **"Plan the beauty transformation you want from your Seoul trip."**

### Existing Travel Recommendation

```text
User
 ↓
Search
 ↓
Spot
 ↓
Review
 ↓
Book
```

### MIYEON

```text
User
 ↓
Goal
 ↓
Beauty Profile
 ↓
Personal Constraints
 ↓
Spot Selection
 ↓
Route Optimization
 ↓
Time Optimization
 ↓
Recovery Planning
 ↓
Personalized Itinerary
 ↓
Book
```

The product's core value is therefore:

**Personalization + Curation + Route Optimization + Time Planning + Beauty Expertise**

---

# 29. MVP UX Scope

For the first version, prioritize:

### Onboarding

- Trip purpose
- Beauty goals
- Basic restrictions
- Budget
- Time
- Downtime
- Conditional questions

### Recommendation

- Hard filtering
- Spot scoring
- Geographic clustering
- Opening hours
- Duration
- Basic travel time

### Itinerary

- Day-by-day timeline
- Spot cards
- Travel time
- Map
- Why this spot / why this order
- Replace
- Remove
- Regenerate

### Booking

- External booking link
- Directions
- Spot details

---

# 30. Product North Star

MIYEON should make the user feel:

> **"I didn't know what I needed when I arrived in Korea. MIYEON figured it out for me."**

The ideal experience is not:

> "Here are 20 Korean beauty places."

It is:

> "Based on what you told us, here's the beauty journey we'd recommend for your trip."

That distinction should guide both the UX and the underlying itinerary-generation engine.
