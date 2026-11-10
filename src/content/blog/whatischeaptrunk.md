---
title: "What is Cheaptrunk?"
description: "One small European VM, three doors, about €110 a year: how Cheaptrunk is built and why"
date: 2026-11-10
tags: [Architecture design, n8n, automation, Docker, Bunny.net, Wireguard, VPN, Github Actions, CI, cheaptrunk]
draft: false
---

Cheaptrunk hosts this site, a couple of automations I actually use every week, and it doubles as a playground for the things I do for a living: infrastructure as code, GitOps, finding cost-efficient solutions to real-life problems, and having fun.

This post is a general tour of how it's built and why.

## The three main principles behind Cheaptrunk

- **Real problems to solve.** Right now Cheaptrunk runs two things I need: a few scrapers that mail me weekly digests, and an on-demand subtitle translator that takes an `.srt` file and sends it back in the language I ask for.
- **Cost control.** A personal project shouldn't have a bill that moves with geopolitics or the next round of tariff wars. I want to know what this costs next year, and I want that number to be small.
- **Data sovereignty.** This one is closely tied to the previous one. For me, independence and real data sovereignty aren't a hobby or a quirk: they're a political choice. I needed a place of my own on a European provider, under predictable rules.

## The shape of it

It all starts from one small virtual machine on Hetzner: 2 vCPUs and 4 GB of RAM, with Docker Compose. At the moment it runs two containers: n8n, the workflow engine behind the automations, and Caddy, which terminates TLS and decides who gets in.

Since the resources of the VPS are limited, I went with Docker Compose rather than Kubernetes: on a single node, Kubernetes would easily eat half the memory just to orchestrate two containers.

The easiest way to understand the rest is to look at how connections are handled: there are three kinds of traffic, and each one gets a different level of trust.

![Architecture diagram. Visitors reach the static site through the Bunny.net CDN. Uploaders reach the subtitle form through the same CDN, with no caching and a rate limit. I reach the n8n editor only through a WireGuard tunnel. Inside the Hetzner firewall, Caddy checks a CDN-only secret, allows only the form paths and accepts editor traffic only from the VPN. n8n calls Gemini and Gmail outbound.](/images/blog/whatischeaptrunk/architecture.svg)

*One VM, three doors. IPs, ports, origin hostnames and secret names are left out on purpose.*

## Door one: this very site (open)

cheaptrunk.dev is static, built with Astro, an optimized JavaScript web framework, ideal for a small portfolio site like this one. Here the door is clearly open: anyone can read and view this website, and nothing on it changes per visitor, so it can be cached with no major drawbacks.

It sits behind Bunny.net, a CDN based in Slovenia, which also hosts the DNS. I picked it over Cloudflare for the reasons mentioned above: European, and cheap at this scale.

The VM never serves visitors directly. Bunny's CDN fetches pages from the server, and the server only answers requests that carry a secret only the CDN knows, while anything else is dropped.

Deploys are pull-based, and this is the part I'm happiest with. When I push to the repository, GitHub Actions builds the site and publishes it as a release with a checksum. I didn't want to use semantic versioning here, because it would have meant over-engineering something that really didn't need it: visitors always get the latest version and nobody ever pins a specific one, so a tag made of the build date and the commit hash is all I need.

A script on the VM checks for new releases every few minutes, verifies the checksum, unpacks the new version next to the old ones, and switches over in one step. Rolling back means pointing at the previous folder. GitHub keeps the last 50 releases and the VM keeps the last three unpacked, which is more than enough history for a personal site.

This means CI never logs into the server. There are no deploy keys stored in GitHub that could be stolen, and the server's SSH port is closed to everyone except me. The connection always starts from the server.

![Pull-based deploy diagram. On GitHub: push to main, a build job with a read-only token, a publish job with write access that creates a release with a tarball and its sha256. On the VM: a systemd timer checks for a new release every five minutes, downloads it and verifies the checksum, extracts it next to the previous ones and atomically switches the current symlink. CI never connects to the VM.](/images/blog/whatischeaptrunk/pull-deploy.svg)

*GitHub builds and publishes, the VM checks and pulls.*

## Door two: the subtitle translator form (ajar)

The subtitle translator automation needs a public upload form, so this door has to open to strangers... but only as much as needed.

The form lives on its own hostname behind the same Bunny.net CDN, with caching turned off since every upload is different. On top of that:

- the CDN rate-limits requests per IP, so nobody can turn my translation budget into their free API;
- the origin again only accepts requests carrying the CDN's secret, a different one from the site's;
- the proxy forwards an explicit allowlist of paths, the form and its webhook, and answers 404 to everything else.

I've seen this happen. Certificates are logged publicly, so a new hostname gets noticed quickly: within hours, automated scanners were requesting paths that don't exist on it, and they all got a 404. With an allowlist I don't have to guess what they'll try next.

Behind the form, n8n handles the rest. A Code node builds the request and splits large files into chunks, another Code node stitches the translated chunks back together, and n8n's built-in nodes turn the result into a file and send it by email. Gemini Flash-Lite, Google's model, only receives the subtitle text and translates it. I kept the file structure and the logic out of the model on purpose: the workflow is more predictable and cheaper this way, and when something breaks I know where to look.

How I shaped this automation around what I actually needed deserves a post of its own, and it's coming next.

## Door three: the n8n dashboard (closed)

The n8n editor is where the workflows and their credentials live. It's the most sensitive thing on the box, so from the outside it simply doesn't exist: the port is closed at the provider's firewall.

The only way in is a WireGuard tunnel from my computer. WireGuard is silent to anyone without a valid key, so its port gives nothing away to a scan. I chose it over Tailscale because I wanted full control over the VPN and no third-party coordination service in the middle.

There's a second lock behind the first. Even if someone reopened that firewall port by mistake, the proxy itself refuses any request that doesn't come from inside the VPN.

The editor is also the one thing that isn't behind the CDN. I tried: its live updates run over WebSockets, and through the CDN the connection opened and died within a tenth of a second, whatever I configured. So I decided to keep the editor off the CDN, and only plain-HTTP traffic goes through it.

## Things that broke

I learned a lot from what went wrong. Two incidents in particular stuck with me.

**The Google OAuth app that expired every week.** The automations send email through a Google account, and the connection kept dying every seven days. It always happened after exactly seven days, which made me think the cause was on my side rather than a random error. Digging through Google's documentation, I found that an OAuth app left in "Testing" mode gets refresh tokens that expire after a week. I went through the publishing steps, reconnected the account, and it hasn't happened since.

**The hour that broke the VPN.** The week after the switch from summer time, the editor stopped loading. The tunnel was up, nothing in the logs. For a moment or two I was lost, then I decided to look at the state of the tunnel:

```bash
sudo systemctl status wg-quick@wg0 --no-pager
sudo wg show | grep -E 'handshake|transfer'
```

The service was active, but `wg show` printed this:

```text
  latest handshake: (System clock wound backward; connection problems may ensue.)
```

The cause was my laptop's hardware clock, kept in local time and an hour off after the change. WireGuard sent a handshake stamped an hour in the future; the server accepted it, and then, as a replay protection, silently rejected every later handshake that looked "older". Restarting my side didn't help, because the problem was the timestamp the server remembered. Restarting the server's side fixed it, and setting the laptop's clock to UTC made sure an issue like this won't come back.

## What it costs

| Item | Cost |
|---|---|
| Hetzner VM | €7.31 / month (VAT included) |
| Bunny.net (CDN, DNS, rate limiting) | $1 / month minimum |
| Domain | $13.18 / year |
| LLM API | cents, with a hard cap |

About **€110 a year**, roughly €9 a month.

## What's still missing, and what I'm working on

- **Configuration by hand.** The VM was built step by step from the terminal. Next comes Ansible, applied from the server itself in the same pull model as the site, then Terraform for the cloud resources.
- **Dependency hygiene.** Renovate to keep images and actions up to date, Trivy to scan them in CI.
- **Backups and monitoring.** The workflow data has no automatic backup yet, and nothing outside the server watches whether it's alive.
- **Not everything is European yet.** The infrastructure is, but some of the services the workflows call, the email account and the LLM, are not. That's the next frontier.

## Why "Cheaptrunk"

The name happened mostly by accident. I was choosing which registrar to trust with the domain, read "Namecheap", and found it funny. Gluing "cheap" to "trunk", a word that makes me think of trees but also of a box you pack things into, a bit like containers, made me smile, and it felt like the right name for this place.

I'm happy with how it turned out. One day I'd like to run more complex things on it, maybe self-hosted with Kubernetes under the hood. For now the goals are closer: keeping this blog updated, getting through the list above, and having fun learning along the way.