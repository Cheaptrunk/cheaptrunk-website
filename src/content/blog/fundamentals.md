---
title: "Fundamentals: a Claude skill for reading outside your field"
description: "A Claude skill that maps the prerequisite concepts of a text for you."
date: 2026-11-17
tags: [Claude, Skills, IA, Study, Reading, Cheaptrunk]
draft: false
---


![Banner of the fundamentals Claude skill: the command /fundamentals in large type on a dark background, a small "MIT" stamp, the line "Enrico M | cheaptrunk.dev", and a band of small connected squares at the bottom.](/images/blog/fundamentals/banner.png)

Figuring things out on my own, understanding and studying are among the things I enjoy most in the world, and like a lot of people, I find myself more and more often using Claude and Mistral's Vibe as guides and mentors I can put questions to.

Over the last few months I've had to read technical texts from very different fields, and one thing I kept needing was a quick list of the core concepts I had to master, or at least know, to really understand a paragraph or a particularly tough passage.

So I decided to turn this need into a Claude skill called "fundamentals". The instructions are a plain text file, so it's easy to adapt it to any other AI that has tools equivalent to Claude's skills.

Fundamentals reads the text and maps the concepts that are mentioned without being explained, leaving out the ones the text already makes clear. It orders them so that each entry only uses terms defined above it, groups them by domain, expands acronyms, and gives each entry a short definition with a precise link to the matching Wikipedia page. When Wikipedia isn't enough, it points to the official source instead: the RFC, the standard, the law.

There are a couple of rules I felt it was essential to build in. If a link can't be verified, it gets flagged instead of made up, and if there are more than 20 concepts, the skill stops and asks whether you want the full list, only the ten essential ones, or one domain at a time. It doesn't summarize the text, and it doesn't interpret or simplify it. It only tells you what you need to know before reading it.

For example, if we have it analyze this passage: "When a browser opens an HTTPS page, TLS secures the connection first: the server sends its certificate, the browser checks it, and from then on every HTTP request travels encrypted", it will give us back 11 concepts split between networking and cryptography. Among them are digital signatures and certificate authorities, which don't appear in the passage, but without them "the browser checks it" doesn't make sense.

In the repository linked at the end of the post you'll find `README.md` and `SKILL.md` with all the rules and principles behind the skill, plus the instructions to install it and see right away whether it's useful to you.

It's MIT licensed, so you can change it and adapt it however you like. I'd really like to hear about the results of your experiments: send me an email, you'll find my contact in the [whoami](/whoami) section!

Have fun, and happy studying.

[github.com/Cheaptrunk/fundamentals](https://github.com/Cheaptrunk/fundamentals)