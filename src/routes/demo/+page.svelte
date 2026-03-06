<script lang="ts">
	import { base } from '$app/paths';
	import { OKLCH, contrastRatio, contrastRatioAlpha, wcagLevels, wcagColor, simulateVision, visionSimulations, resolveGroups, type ColorGroup, type VisionSimulation } from '$lib/oklch';

	type SchemeModule = { default: ColorGroup[] };
	const modules = import.meta.glob<SchemeModule>('../../lib/schemes/*.ts', { eager: true });

	const schemes = Object.entries(modules).map(([path, mod]) => ({
		name: path.split('/').pop()!.replace('.ts', ''),
		groups: mod.default
	}));

	let schemeIndex = $state(0);
	let demoIndex = $state(0);
	let auditOpen = $state(true);
	let visionSim = $state<VisionSimulation>('none');

	const demos = ['Landing Page', 'Dashboard', 'Blog'];

	const resolvedGroups = $derived(resolveGroups(schemes[schemeIndex]?.groups ?? []));
	const groups = $derived(
		visionSim === 'none'
			? resolvedGroups
			: resolvedGroups.map((g) => ({
					...g,
					colors: g.colors.map((c) => simulateVision(c, visionSim))
				}))
	);
	const colors = $derived(groups.flatMap((g) => g.colors));

	interface Roles {
		bg: number;
		fg: number;
		primary: number;
		secondary: number;
		tertiary: number;
		accent: number;
		surface: number;
		border: number;
		primaryFg: number;
		secondaryFg: number;
		tertiaryFg: number;
		accentFg: number;
	}

	let roles = $state<Roles>({
		bg: 0, fg: 1, primary: 2,
		secondary: -1, tertiary: -1, accent: -1,
		surface: -1, border: -1,
		primaryFg: -1, secondaryFg: -1, tertiaryFg: -1, accentFg: -1,
	});

	let opacities = $state({
		muted: 0.65,
		disabled: 0.38,
		hover: 0.85,
		active: 0.70,
	});

	const STORAGE_ROLES = 'demo-roles';
	const STORAGE_OPACITIES = 'demo-opacities';

	function autoAssign(cs: OKLCH[]): Roles {
		const find = (...names: string[]) =>
			cs.findIndex((c) => names.some((n) => c.name.toLowerCase().includes(n)));
		return {
			bg: Math.max(0, find('background', 'bg')),
			fg: Math.max(0, find('foreground', 'fg', 'text')),
			primary: Math.max(0, find('primary')),
			secondary: find('secondary'),
			tertiary: find('tertiary'),
			accent: find('accent'),
			surface: find('bg-darker', 'bg-lighter', 'surface'),
			border: -1,
			primaryFg: -1, secondaryFg: -1, tertiaryFg: -1, accentFg: -1,
		};
	}

	function loadStored<T>(key: string, schemeName: string): T | null {
		try {
			const stored = sessionStorage.getItem(key);
			if (!stored) return null;
			const all = JSON.parse(stored);
			return all[schemeName] ?? null;
		} catch { return null; }
	}

	function saveStored<T>(key: string, schemeName: string, data: T) {
		try {
			const stored = sessionStorage.getItem(key);
			const all = stored ? JSON.parse(stored) : {};
			all[schemeName] = data;
			sessionStorage.setItem(key, JSON.stringify(all));
		} catch {}
	}

	$effect(() => {
		const name = schemes[schemeIndex]?.name;
		if (!name || !colors.length) return;
		const savedRoles = loadStored<Roles>(STORAGE_ROLES, name);
		roles = savedRoles ?? autoAssign(colors);
		const savedOpacities = loadStored<typeof opacities>(STORAGE_OPACITIES, name);
		if (savedOpacities) opacities = savedOpacities;
	});

	$effect(() => {
		const name = schemes[schemeIndex]?.name;
		if (!name) return;
		saveStored(STORAGE_ROLES, name, roles);
		saveStored(STORAGE_OPACITIES, name, opacities);
	});

	const vars = $derived.by(() => {
		const bg = colors[roles.bg];
		const fg = colors[roles.fg];
		const primary = colors[roles.primary];
		if (!bg || !fg || !primary) return '';

		const get = (idx: number, fallback: OKLCH) => idx >= 0 ? colors[idx] ?? fallback : fallback;

		const secondary = get(roles.secondary, primary);
		const tertiary = get(roles.tertiary, secondary);
		const accent = get(roles.accent, primary);
		const surface = get(roles.surface, bg);
		const border = get(roles.border, fg);
		const primaryFg = get(roles.primaryFg, fg);
		const secondaryFg = get(roles.secondaryFg, fg);
		const tertiaryFg = get(roles.tertiaryFg, fg);
		const accentFg = get(roles.accentFg, fg);

		return [
			`--bg:${bg.toCSS()}`, `--fg:${fg.toCSS()}`,
			`--primary:${primary.toCSS()}`, `--primary-fg:${primaryFg.toCSS()}`,
			`--secondary:${secondary.toCSS()}`, `--secondary-fg:${secondaryFg.toCSS()}`,
			`--tertiary:${tertiary.toCSS()}`, `--tertiary-fg:${tertiaryFg.toCSS()}`,
			`--accent:${accent.toCSS()}`, `--accent-fg:${accentFg.toCSS()}`,
			`--surface:${surface.toCSS()}`, `--surface-fg:${fg.toCSS()}`,
			`--border:${border.toCSS()}`,
			`--op-muted:${opacities.muted}`, `--op-disabled:${opacities.disabled}`,
			`--op-hover:${opacities.hover}`, `--op-active:${opacities.active}`,
		].join(';');
	});

	interface AuditPair {
		label: string;
		fg: string;
		bg: string;
		ratio: number;
		large?: boolean;
	}

	const audit = $derived.by((): AuditPair[] => {
		const bgC = colors[roles.bg];
		const fgC = colors[roles.fg];
		const priC = colors[roles.primary];
		if (!bgC || !fgC || !priC) return [];

		const get = (idx: number, fallback: OKLCH) => idx >= 0 ? colors[idx] ?? fallback : fallback;
		const secC = get(roles.secondary, priC);
		const terC = get(roles.tertiary, secC);
		const accC = get(roles.accent, priC);
		const surC = get(roles.surface, bgC);
		const borC = get(roles.border, fgC);
		const priFgC = get(roles.primaryFg, fgC);
		const secFgC = get(roles.secondaryFg, fgC);
		const terFgC = get(roles.tertiaryFg, fgC);
		const accFgC = get(roles.accentFg, fgC);

		const pair = (label: string, fg: OKLCH, bg: OKLCH, alpha?: number, large?: boolean): AuditPair => ({
			label,
			fg: fg.name + (alpha != null ? ` @${alpha}` : ''),
			bg: bg.name,
			ratio: alpha != null ? contrastRatioAlpha(fg, bg, alpha) : contrastRatio(fg, bg),
			large,
		});

		return [
			pair('Body text', fgC, bgC),
			pair('Muted text', fgC, bgC, opacities.muted),
			pair('Disabled text', fgC, bgC, opacities.disabled),
			pair('Body on surface', fgC, surC),
			pair('Muted on surface', fgC, surC, opacities.muted),
			pair('Primary btn', priFgC, priC),
			pair('Secondary btn', secFgC, secC),
			pair('Tertiary btn', terFgC, terC),
			pair('Accent btn', accFgC, accC),
			pair('Primary on bg', priC, bgC),
			pair('Primary on surface', priC, surC),
			pair('Secondary on bg', secC, bgC),
			pair('Secondary on surface', secC, surC),
			pair('Tertiary on bg', terC, bgC),
			pair('Accent on bg', accC, bgC),
			pair('Badge muted', fgC, borC, opacities.muted),
			pair('Stats banner label', priFgC, priC, 0.8),
			pair('CTA sub', secFgC, secC, 0.85),
			pair('Nav link (muted)', fgC, bgC, opacities.muted),
			pair('Dash nav active', priFgC, priC),
			pair('Dash nav item', fgC, surC, opacities.muted),
		];
	});
</script>

<div class="page">
	<aside class="sidebar">
		<a href="{base}/" class="back-link">&larr; Matrix</a>

		<label class="field-label">Scheme
			<select class="field-select" bind:value={schemeIndex}>
				{#each schemes as s, i}<option value={i}>{s.name}</option>{/each}
			</select>
		</label>

		<label class="field-label">Demo
			<select class="field-select" bind:value={demoIndex}>
				{#each demos as d, i}<option value={i}>{d}</option>{/each}
			</select>
		</label>

		<label class="field-label">Vision
			<select class="field-select" bind:value={visionSim}>
				{#each visionSimulations as sim}<option value={sim.value}>{sim.label}</option>{/each}
			</select>
		</label>

		<div class="roles-title">Color Roles</div>

		{#each [
			['bg', 'Background', false],
			['fg', 'Foreground', false],
			['primary', 'Primary', false],
			['primaryFg', 'Primary FG', true],
			['secondary', 'Secondary', true],
			['secondaryFg', 'Secondary FG', true],
			['tertiary', 'Tertiary', true],
			['tertiaryFg', 'Tertiary FG', true],
			['accent', 'Accent', true],
			['accentFg', 'Accent FG', true],
			['surface', 'Surface', true],
			['border', 'Border', true],
		] as [key, label, optional]}
			<div class="role-row">
				<div class="role-swatch" style="background: {roles[key as keyof Roles] >= 0 ? colors[roles[key as keyof Roles]]?.toCSS() ?? '#333' : '#333'}"></div>
				<label class="role-label">{label}
					<select class="role-select" bind:value={roles[key as keyof Roles]}>
						{#if optional}<option value={-1}>None</option>{/if}
						{#each colors as color, i}
							<option value={i}>{color.name} ({color.hex})</option>
						{/each}
					</select>
				</label>
			</div>
		{/each}

		<div class="roles-title">Foreground Opacities</div>

		{#each [
			['muted', 'Muted'],
			['disabled', 'Disabled'],
			['hover', 'Hover'],
			['active', 'Active'],
		] as [key, label]}
			<label class="opacity-label">
				<span class="opacity-name">{label}</span>
				<input
					type="range"
					min="0" max="1" step="0.01"
					class="opacity-range"
					bind:value={opacities[key as keyof typeof opacities]}
				/>
				<span class="opacity-value">{opacities[key as keyof typeof opacities].toFixed(2)}</span>
			</label>
		{/each}
	</aside>

	<main class="demo-scroll">
		<div class="demo" style={vars}>
			{#if demoIndex === 0}
				<!-- Landing Page -->
				<nav class="d-nav">
					<div class="d-nav-inner">
						<span class="d-logo">Acme</span>
						<div class="d-nav-links">
							<a href="#f">Features</a>
							<a href="#p">Pricing</a>
							<a href="#a">About</a>
						</div>
						<button class="d-btn d-btn-primary">Get Started</button>
					</div>
				</nav>

				<section class="d-hero">
					<h1 class="d-hero-title">Build better products,<br>faster than ever</h1>
					<p class="d-hero-sub">The modern platform for teams who ship. Streamline your workflow, collaborate in real-time, and deliver with confidence.</p>
					<div class="d-hero-actions">
						<button class="d-btn d-btn-primary d-btn-lg">Start Free Trial</button>
						<button class="d-btn d-btn-outline d-btn-lg">Watch Demo</button>
					</div>
				</section>

				<section class="d-section">
					<h2 class="d-section-title">Everything you need</h2>
					<p class="d-section-sub">Powerful features to help your team succeed</p>
					<div class="d-cards-3">
						<div class="d-card">
							<div class="d-card-icon" style="background: var(--primary); color: var(--primary-fg)">&#9672;</div>
							<h3 class="d-card-title">Lightning Fast</h3>
							<p class="d-card-text">Optimized for speed at every level. Your team won't wait for tools to catch up.</p>
						</div>
						<div class="d-card">
							<div class="d-card-icon" style="background: var(--secondary); color: var(--secondary-fg)">&#9881;</div>
							<h3 class="d-card-title">Fully Configurable</h3>
							<p class="d-card-text">Adapt the platform to your workflow. Custom fields, automations, and integrations.</p>
						</div>
						<div class="d-card">
							<div class="d-card-icon" style="background: var(--tertiary); color: var(--tertiary-fg)">&#9734;</div>
							<h3 class="d-card-title">Team Collaboration</h3>
							<p class="d-card-text">Real-time editing, comments, and notifications keep everyone aligned.</p>
						</div>
					</div>
				</section>

				<section class="d-stats-banner">
					<div class="d-stats-grid">
						<div class="d-stat"><div class="d-stat-num">10K+</div><div class="d-stat-label">Teams</div></div>
						<div class="d-stat"><div class="d-stat-num">2M</div><div class="d-stat-label">Projects</div></div>
						<div class="d-stat"><div class="d-stat-num">99.9%</div><div class="d-stat-label">Uptime</div></div>
						<div class="d-stat"><div class="d-stat-num">24/7</div><div class="d-stat-label">Support</div></div>
					</div>
				</section>

				<section class="d-section">
					<h2 class="d-section-title">What our users say</h2>
					<div class="d-cards-2">
						<div class="d-card">
							<p class="d-card-text" style="font-style: italic">"This platform transformed how our team works. We shipped 3x faster in the first month."</p>
							<div class="d-testimonial-author">
								<div class="d-avatar" style="background: var(--primary); color: var(--primary-fg)">JD</div>
								<div><div class="d-card-title" style="margin:0">Jane Doe</div><div class="d-card-text" style="margin:0">CTO, StartupCo</div></div>
							</div>
						</div>
						<div class="d-card">
							<p class="d-card-text" style="font-style: italic">"The best tool we've adopted this year. Clean, fast, and our whole team loves it."</p>
							<div class="d-testimonial-author">
								<div class="d-avatar" style="background: var(--secondary); color: var(--secondary-fg)">AS</div>
								<div><div class="d-card-title" style="margin:0">Alex Smith</div><div class="d-card-text" style="margin:0">Lead Engineer, BigCorp</div></div>
							</div>
						</div>
					</div>
				</section>

				<section class="d-cta-banner">
					<h2 class="d-cta-title">Ready to get started?</h2>
					<p class="d-cta-sub">Join thousands of teams already using Acme.</p>
					<button class="d-btn d-btn-primary d-btn-lg">Start Free Trial</button>
				</section>

				<footer class="d-footer">
					<div class="d-footer-inner">
						<div class="d-footer-col">
							<div class="d-logo">Acme</div>
							<p class="d-footer-text">Building the future of team productivity.</p>
						</div>
						<div class="d-footer-col">
							<div class="d-footer-heading">Product</div>
							<a href="#f" class="d-footer-link">Features</a>
							<a href="#p" class="d-footer-link">Pricing</a>
							<a href="#c" class="d-footer-link">Changelog</a>
						</div>
						<div class="d-footer-col">
							<div class="d-footer-heading">Company</div>
							<a href="#a" class="d-footer-link">About</a>
							<a href="#b" class="d-footer-link">Blog</a>
							<a href="#ca" class="d-footer-link">Careers</a>
						</div>
						<div class="d-footer-col">
							<div class="d-footer-heading">Legal</div>
							<a href="#pr" class="d-footer-link">Privacy</a>
							<a href="#t" class="d-footer-link">Terms</a>
						</div>
					</div>
				</footer>

			{:else if demoIndex === 1}
				<!-- Dashboard -->
				<div class="dash">
					<aside class="dash-sidebar">
						<div class="d-logo" style="padding: 16px">App</div>
						<nav class="dash-nav">
							<a href="#d" class="dash-nav-item active">
								<span class="dash-nav-icon">&#9632;</span> Dashboard
							</a>
							<a href="#pr" class="dash-nav-item">
								<span class="dash-nav-icon">&#9776;</span> Projects
							</a>
							<a href="#t" class="dash-nav-item">
								<span class="dash-nav-icon">&#9745;</span> Tasks
							</a>
							<a href="#m" class="dash-nav-item">
								<span class="dash-nav-icon">&#9993;</span> Messages
							</a>
							<a href="#s" class="dash-nav-item">
								<span class="dash-nav-icon">&#9881;</span> Settings
							</a>
						</nav>
					</aside>
					<div class="dash-main">
						<header class="dash-topbar">
							<h1 class="dash-page-title">Dashboard</h1>
							<div class="dash-topbar-right">
								<button class="d-btn d-btn-outline" style="font-size:13px">&#9993; 3</button>
								<div class="d-avatar d-avatar-sm" style="background: var(--primary); color: var(--primary-fg)">U</div>
							</div>
						</header>
						<div class="dash-content">
							<div class="d-cards-4">
								<div class="d-card dash-stat-card">
									<div class="d-card-text">Revenue</div>
									<div class="dash-stat-value">$12,480</div>
									<div class="dash-stat-change" style="color: var(--primary)">+12.5%</div>
								</div>
								<div class="d-card dash-stat-card">
									<div class="d-card-text">Users</div>
									<div class="dash-stat-value">1,845</div>
									<div class="dash-stat-change" style="color: var(--secondary)">+8.2%</div>
								</div>
								<div class="d-card dash-stat-card">
									<div class="d-card-text">Orders</div>
									<div class="dash-stat-value">284</div>
									<div class="dash-stat-change" style="color: var(--tertiary)">+23.1%</div>
								</div>
								<div class="d-card dash-stat-card">
									<div class="d-card-text">Conversion</div>
									<div class="dash-stat-value">3.2%</div>
									<div class="dash-stat-change" style="color: var(--accent)">+0.4%</div>
								</div>
							</div>

							<div class="d-cards-2" style="margin-top: 20px">
								<div class="d-card">
									<div class="dash-card-header">
										<h3 class="d-card-title">Recent Orders</h3>
										<a href="#v" class="dash-view-all">View all</a>
									</div>
									<table class="dash-table">
										<thead>
											<tr><th>Order</th><th>Customer</th><th>Amount</th><th>Status</th></tr>
										</thead>
										<tbody>
											<tr><td>#1234</td><td>Alice Johnson</td><td>$120.00</td><td><span class="d-badge" style="background: var(--primary); color: var(--primary-fg)">Active</span></td></tr>
											<tr><td>#1233</td><td>Bob Williams</td><td>$85.50</td><td><span class="d-badge" style="background: var(--secondary); color: var(--secondary-fg)">Shipped</span></td></tr>
											<tr><td>#1232</td><td>Carol Davis</td><td>$210.00</td><td><span class="d-badge" style="background: var(--primary); color: var(--primary-fg)">Active</span></td></tr>
											<tr><td>#1231</td><td>Dan Miller</td><td>$45.00</td><td><span class="d-badge d-badge-muted">Complete</span></td></tr>
											<tr><td>#1230</td><td>Eve Wilson</td><td>$168.00</td><td><span class="d-badge d-badge-muted">Complete</span></td></tr>
										</tbody>
									</table>
								</div>
								<div class="d-card">
									<h3 class="d-card-title">Activity</h3>
									<div class="dash-activity">
										<div class="dash-activity-item">
											<div class="dash-activity-dot" style="background: var(--primary)"></div>
											<div>
												<div class="d-card-text" style="margin:0"><strong>New signup</strong> - alice@example.com</div>
												<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">2 min ago</div>
											</div>
										</div>
										<div class="dash-activity-item">
											<div class="dash-activity-dot" style="background: var(--secondary)"></div>
											<div>
												<div class="d-card-text" style="margin:0"><strong>Order placed</strong> - #1234 ($120.00)</div>
												<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">15 min ago</div>
											</div>
										</div>
										<div class="dash-activity-item">
											<div class="dash-activity-dot" style="background: var(--tertiary)"></div>
											<div>
												<div class="d-card-text" style="margin:0"><strong>Payment received</strong> - $85.50</div>
												<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">1 hour ago</div>
											</div>
										</div>
										<div class="dash-activity-item">
											<div class="dash-activity-dot" style="background: var(--accent)"></div>
											<div>
												<div class="d-card-text" style="margin:0"><strong>New comment</strong> on Project Alpha</div>
												<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">3 hours ago</div>
											</div>
										</div>
									</div>
								</div>
							</div>

							<div class="d-card" style="margin-top: 20px">
								<h3 class="d-card-title">Performance</h3>
								<div class="dash-chart">
									{#each [65, 45, 80, 55, 70, 90, 60, 75, 85, 50, 70, 88] as val, i}
										<div class="dash-bar-col">
											<div class="dash-bar" style="height: {val}%; background: var({i % 3 === 0 ? '--primary' : i % 3 === 1 ? '--secondary' : '--tertiary'})"></div>
											<span class="dash-bar-label">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
										</div>
									{/each}
								</div>
							</div>
						</div>
					</div>
				</div>

			{:else}
				<!-- Blog -->
				<nav class="d-nav">
					<div class="d-nav-inner">
						<span class="d-logo">The Journal</span>
						<div class="d-nav-links">
							<a href="#h">Home</a>
							<a href="#ca">Categories</a>
							<a href="#ab">About</a>
						</div>
						<button class="d-btn d-btn-outline" style="font-size: 13px">Subscribe</button>
					</div>
				</nav>

				<div class="blog-layout">
					<article class="blog-article">
						<div class="blog-category" style="color: var(--primary)">Design</div>
						<h1 class="blog-title">The Art of Color Theory in Modern Interface Design</h1>
						<div class="blog-meta">
							<div class="d-avatar d-avatar-sm" style="background: var(--primary); color: var(--primary-fg)">MK</div>
							<span>Maya Kim</span>
							<span style="color: var(--fg); opacity: var(--op-muted)">&middot;</span>
							<span style="color: var(--fg); opacity: var(--op-muted)">Jan 15, 2025</span>
							<span style="color: var(--fg); opacity: var(--op-muted)">&middot;</span>
							<span style="color: var(--fg); opacity: var(--op-muted)">8 min read</span>
						</div>

						<div class="blog-hero-img" style="background: var(--primary); opacity: 0.15"></div>

						<div class="blog-body">
							<p>Color is one of the most powerful tools in a designer's arsenal. It guides attention, communicates meaning, and shapes the emotional experience of an interface. Yet many teams treat color as an afterthought, picking palettes based on personal preference rather than systematic thinking.</p>

							<h2>Understanding OKLCH</h2>
							<p>The OKLCH color space represents a significant advancement in how we think about color for digital interfaces. Unlike RGB or HSL, OKLCH provides perceptually uniform lightness, making it possible to create color palettes where perceived contrast is consistent across different hues.</p>

							<blockquote class="blog-quote">
								"Good color isn't about picking pretty hues. It's about building a system where every color has a purpose and every combination is intentional."
							</blockquote>

							<p>When building a color scheme, start with your background and foreground. These two colors define the foundation of your visual hierarchy. Everything else builds on this relationship.</p>

							<h2>Building a Palette</h2>
							<p>A robust color palette typically includes:</p>
							<ul>
								<li><strong>Background & foreground</strong> - your base contrast pair</li>
								<li><strong>Primary</strong> - your brand color, used for CTAs and key interactive elements</li>
								<li><strong>Secondary</strong> - supports the primary, used for less prominent actions</li>
								<li><strong>Accent</strong> - adds visual interest and highlights</li>
								<li><strong>Semantic colors</strong> - success, warning, error, info</li>
							</ul>

							<h2>Contrast Matters</h2>
							<p>WCAG guidelines specify minimum contrast ratios for text readability. Normal text requires at least 4.5:1 for AA compliance, while large text needs 3:1. These aren't arbitrary numbers - they ensure your content is accessible to users with varying levels of visual ability.</p>

							<div class="blog-callout">
								<div class="blog-callout-title">Key Takeaway</div>
								<p>Always test your color combinations in context. A color that looks great in isolation may fail when paired with your background, or clash with neighboring elements in a real layout.</p>
							</div>

							<p>The best color systems are built with relationships, not fixed values. Define your primary color, then derive secondary and accent colors using consistent lightness, chroma shifts, and hue rotations. This approach ensures your palette stays cohesive as it evolves.</p>
						</div>

						<div class="blog-tags">
							<span class="d-badge" style="background: var(--primary); color: var(--primary-fg)">Design</span>
							<span class="d-badge" style="background: var(--secondary); color: var(--secondary-fg)">Color Theory</span>
							<span class="d-badge" style="background: var(--tertiary); color: var(--tertiary-fg)">UI</span>
							<span class="d-badge d-badge-muted">OKLCH</span>
						</div>

						<div class="blog-author-card">
							<div class="d-avatar" style="background: var(--primary); color: var(--primary-fg); font-size: 18px; width: 48px; height: 48px">MK</div>
							<div>
								<div style="font-weight: 600">Maya Kim</div>
								<div class="d-card-text" style="margin: 0">Design systems lead with 10 years of experience in digital product design. Passionate about color theory and accessible interfaces.</div>
							</div>
						</div>
					</article>

					<aside class="blog-sidebar">
						<div class="d-card">
							<h3 class="d-card-title">Categories</h3>
							<div class="blog-cat-list">
								<a href="#d" class="blog-cat-item"><span>Design</span><span class="blog-cat-count" style="background: var(--primary); color: var(--primary-fg)">12</span></a>
								<a href="#e" class="blog-cat-item"><span>Engineering</span><span class="blog-cat-count" style="background: var(--secondary); color: var(--secondary-fg)">8</span></a>
								<a href="#p" class="blog-cat-item"><span>Product</span><span class="blog-cat-count" style="background: var(--tertiary); color: var(--tertiary-fg)">5</span></a>
								<a href="#c" class="blog-cat-item"><span>Culture</span><span class="blog-cat-count d-badge-muted">3</span></a>
							</div>
						</div>
						<div class="d-card">
							<h3 class="d-card-title">Related Posts</h3>
							<div class="blog-related">
								<a href="#r1" class="blog-related-item">
									<div class="blog-related-thumb" style="background: var(--secondary)"></div>
									<div>
										<div style="font-weight: 500; font-size: 14px">Accessible Color Palettes</div>
										<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">5 min read</div>
									</div>
								</a>
								<a href="#r2" class="blog-related-item">
									<div class="blog-related-thumb" style="background: var(--tertiary)"></div>
									<div>
										<div style="font-weight: 500; font-size: 14px">Dark Mode Done Right</div>
										<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">7 min read</div>
									</div>
								</a>
								<a href="#r3" class="blog-related-item">
									<div class="blog-related-thumb" style="background: var(--accent)"></div>
									<div>
										<div style="font-weight: 500; font-size: 14px">Design Tokens at Scale</div>
										<div style="color: var(--fg); opacity: var(--op-muted); font-size: 12px">6 min read</div>
									</div>
								</a>
							</div>
						</div>
					</aside>
				</div>

				<footer class="d-footer">
					<div class="d-footer-inner">
						<div class="d-footer-col"><div class="d-logo">The Journal</div><p class="d-footer-text">Thoughts on design, engineering, and building great products.</p></div>
						<div class="d-footer-col">
							<div class="d-footer-heading">Topics</div>
							<a href="#d" class="d-footer-link">Design</a>
							<a href="#e" class="d-footer-link">Engineering</a>
							<a href="#p" class="d-footer-link">Product</a>
						</div>
						<div class="d-footer-col">
							<div class="d-footer-heading">More</div>
							<a href="#a" class="d-footer-link">About</a>
							<a href="#n" class="d-footer-link">Newsletter</a>
							<a href="#r" class="d-footer-link">RSS</a>
						</div>
					</div>
				</footer>
			{/if}
		</div>
	</main>

	<aside class="audit-panel" class:audit-panel-collapsed={!auditOpen}>
		<button class="audit-toggle" onclick={() => auditOpen = !auditOpen}>
			{auditOpen ? 'Audit ▸' : '◂ Audit'}
		</button>
		{#if auditOpen}
			{@const fails = audit.filter(a => { const l = wcagLevels(a.ratio); return (a.large ? l.large : l.normal) === 'Fail'; }).length}
			<div class="audit-content">
				<div class="audit-summary">
					<span class="audit-summary-count" style="color: {fails > 0 ? '#ef4444' : '#22c55e'}">{fails}</span>
					<span class="audit-summary-label">/ {audit.length} failing</span>
				</div>
				<div class="audit-list">
					{#each audit as item}
						{@const levels = wcagLevels(item.ratio)}
						{@const level = item.large ? levels.large : levels.normal}
						<div class="audit-row" class:audit-fail={level === 'Fail'}>
							<div class="audit-label">{item.label}</div>
							<div class="audit-detail">{item.fg} / {item.bg}</div>
							<div class="audit-result">
								<span class="audit-ratio">{item.ratio.toFixed(2)}</span>
								<span class="audit-level" style="color: {wcagColor(level)}">{level}</span>
							</div>
						</div>
					{/each}
				</div>
			</div>
		{/if}
	</aside>
</div>

<style>
	/* Page layout */
	.page {
		display: flex;
		height: 100vh;
		background: #000;
		color: #fff;
	}

	.sidebar {
		width: 220px;
		flex-shrink: 0;
		border-right: 1px solid #333;
		padding: 12px;
		display: flex;
		flex-direction: column;
		gap: 8px;
		overflow-y: auto;
	}

	.back-link {
		color: #888;
		text-decoration: none;
		font-size: 13px;
	}
	.back-link:hover { color: #fff; }

	.field-label {
		display: flex;
		flex-direction: column;
		gap: 3px;
		font-size: 11px;
		color: #888;
	}

	.field-select {
		background: #111;
		color: #fff;
		border: 1px solid #444;
		border-radius: 4px;
		padding: 4px 6px;
		font-size: 13px;
	}

	.roles-title {
		font-size: 10px;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: #555;
		margin-top: 8px;
		padding-top: 8px;
		border-top: 1px solid #222;
	}

	.audit-panel {
		width: 240px;
		flex-shrink: 0;
		border-left: 1px solid #333;
		display: flex;
		flex-direction: column;
		overflow-y: auto;
		transition: width 0.2s ease;
	}

	.audit-panel-collapsed {
		width: 36px;
	}

	.audit-toggle {
		background: none;
		border: none;
		border-bottom: 1px solid #333;
		color: #888;
		font-size: 11px;
		padding: 8px;
		cursor: pointer;
		text-align: left;
		white-space: nowrap;
	}
	.audit-toggle:hover { color: #fff; }

	.audit-content {
		padding: 8px;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.audit-summary {
		display: flex;
		align-items: baseline;
		gap: 4px;
		padding: 4px 6px;
	}

	.audit-summary-count {
		font-size: 18px;
		font-weight: 800;
		font-family: monospace;
	}

	.audit-summary-label {
		font-size: 11px;
		color: #888;
	}

	.audit-list {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.audit-row {
		padding: 4px 6px;
		border-radius: 3px;
		font-size: 10px;
	}

	.audit-fail {
		background: rgba(239, 68, 68, 0.1);
	}

	.audit-label {
		color: #ccc;
		font-weight: 600;
	}

	.audit-detail {
		color: #666;
		font-size: 9px;
	}

	.audit-result {
		display: flex;
		gap: 6px;
		align-items: baseline;
	}

	.audit-ratio {
		font-family: monospace;
		color: #999;
	}

	.audit-level {
		font-weight: 700;
	}

	.role-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.role-swatch {
		width: 14px;
		height: 14px;
		border-radius: 3px;
		border: 1px solid #444;
		flex-shrink: 0;
	}

	.role-label {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: 11px;
		color: #aaa;
	}

	.role-select {
		background: #111;
		color: #fff;
		border: 1px solid #333;
		border-radius: 3px;
		padding: 2px 4px;
		font-size: 11px;
		width: 100%;
	}

	.opacity-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 11px;
		color: #aaa;
	}

	.opacity-name {
		width: 52px;
		flex-shrink: 0;
	}

	.opacity-range {
		flex: 1;
		min-width: 0;
		accent-color: #888;
		height: 14px;
	}

	.opacity-value {
		font-family: monospace;
		font-size: 10px;
		color: #666;
		width: 28px;
		text-align: right;
	}

	/* Demo area */
	.demo-scroll {
		flex: 1;
		min-width: 0;
		overflow: auto;
	}

	.demo {
		background: var(--bg);
		color: var(--fg);
		min-height: 100%;
	}

	/* Shared demo components */
	.d-nav {
		border-bottom: 1px solid var(--border);
	}

	.d-nav-inner {
		max-width: 1100px;
		margin: 0 auto;
		display: flex;
		align-items: center;
		gap: 24px;
		padding: 12px 24px;
	}

	.d-logo {
		font-size: 18px;
		font-weight: 700;
		color: var(--fg);
	}

	.d-nav-links {
		display: flex;
		gap: 20px;
		margin-left: auto;
	}

	.d-nav-links a {
		color: var(--fg);
		opacity: var(--op-muted);
		text-decoration: none;
		font-size: 14px;
	}
	.d-nav-links a:hover { color: var(--fg); opacity: 1; }

	.d-btn {
		padding: 8px 18px;
		border-radius: 6px;
		font-size: 14px;
		font-weight: 500;
		border: none;
		cursor: pointer;
		text-decoration: none;
		display: inline-flex;
		align-items: center;
	}

	.d-btn-primary {
		background: var(--primary);
		color: var(--primary-fg);
	}

	.d-btn-outline {
		background: none;
		color: var(--fg);
		border: 1px solid var(--border);
	}

	.d-btn-lg {
		padding: 12px 28px;
		font-size: 16px;
	}

	/* Hero */
	.d-hero {
		text-align: center;
		padding: 80px 24px;
		max-width: 720px;
		margin: 0 auto;
	}

	.d-hero-title {
		font-size: 48px;
		font-weight: 800;
		line-height: 1.1;
		letter-spacing: -0.03em;
	}

	.d-hero-sub {
		margin-top: 16px;
		font-size: 18px;
		color: var(--fg); opacity: var(--op-muted);
		line-height: 1.6;
	}

	.d-hero-actions {
		margin-top: 32px;
		display: flex;
		gap: 12px;
		justify-content: center;
	}

	/* Sections */
	.d-section {
		max-width: 1100px;
		margin: 0 auto;
		padding: 60px 24px;
	}

	.d-section-title {
		font-size: 32px;
		font-weight: 700;
		text-align: center;
	}

	.d-section-sub {
		text-align: center;
		color: var(--fg); opacity: var(--op-muted);
		margin-top: 8px;
	}

	/* Cards */
	.d-cards-2, .d-cards-3, .d-cards-4 {
		display: grid;
		gap: 20px;
		margin-top: 32px;
	}
	.d-cards-2 { grid-template-columns: 1fr 1fr; }
	.d-cards-3 { grid-template-columns: 1fr 1fr 1fr; }
	.d-cards-4 { grid-template-columns: 1fr 1fr 1fr 1fr; }

	.d-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
		padding: 20px;
	}

	.d-card-icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 20px;
		margin-bottom: 12px;
	}

	.d-card-title {
		font-size: 16px;
		font-weight: 600;
		margin-bottom: 6px;
	}

	.d-card-text {
		font-size: 14px;
		color: var(--fg); opacity: var(--op-muted);
		line-height: 1.5;
	}

	/* Stats banner */
	.d-stats-banner {
		background: var(--primary);
		color: var(--primary-fg);
		padding: 48px 24px;
	}

	.d-stats-grid {
		max-width: 800px;
		margin: 0 auto;
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 24px;
		text-align: center;
	}

	.d-stat-num {
		font-size: 36px;
		font-weight: 800;
	}

	.d-stat-label {
		font-size: 14px;
		opacity: 0.8;
		margin-top: 4px;
	}

	/* Testimonials */
	.d-testimonial-author {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-top: 16px;
	}

	.d-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 14px;
		flex-shrink: 0;
	}

	.d-avatar-sm {
		width: 28px;
		height: 28px;
		font-size: 12px;
	}

	/* CTA Banner */
	.d-cta-banner {
		background: var(--secondary);
		color: var(--secondary-fg);
		text-align: center;
		padding: 60px 24px;
	}

	.d-cta-title {
		font-size: 32px;
		font-weight: 700;
	}

	.d-cta-sub {
		margin-top: 8px;
		font-size: 16px;
		opacity: 0.85;
	}

	.d-cta-banner .d-btn {
		margin-top: 24px;
	}

	/* Footer */
	.d-footer {
		border-top: 1px solid var(--border);
		background: var(--surface);
	}

	.d-footer-inner {
		max-width: 1100px;
		margin: 0 auto;
		padding: 40px 24px;
		display: grid;
		grid-template-columns: 2fr 1fr 1fr 1fr;
		gap: 32px;
	}

	.d-footer-col {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.d-footer-heading {
		font-size: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--fg); opacity: var(--op-muted);
		margin-bottom: 4px;
	}

	.d-footer-link {
		color: var(--fg); opacity: var(--op-muted);
		text-decoration: none;
		font-size: 14px;
	}
	.d-footer-link:hover { color: var(--fg); opacity: 1; }

	.d-footer-text {
		font-size: 14px;
		color: var(--fg); opacity: var(--op-muted);
		line-height: 1.5;
	}

	/* Badge */
	.d-badge {
		display: inline-block;
		padding: 2px 10px;
		border-radius: 99px;
		font-size: 12px;
		font-weight: 600;
	}

	.d-badge-muted {
		background: var(--border);
		color: var(--fg); opacity: var(--op-muted);
	}

	/* ---- Dashboard ---- */
	.dash {
		display: flex;
		min-height: 100vh;
	}

	.dash-sidebar {
		width: 200px;
		background: var(--surface);
		border-right: 1px solid var(--border);
		flex-shrink: 0;
	}

	.dash-nav {
		display: flex;
		flex-direction: column;
		padding: 8px;
		gap: 2px;
	}

	.dash-nav-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		border-radius: 6px;
		color: var(--fg); opacity: var(--op-muted);
		text-decoration: none;
		font-size: 14px;
	}
	.dash-nav-item:hover { color: var(--fg); background: var(--border); }
	.dash-nav-item.active {
		color: var(--primary-fg);
		background: var(--primary);
	}

	.dash-nav-icon {
		font-size: 14px;
		width: 18px;
		text-align: center;
	}

	.dash-main {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	.dash-topbar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 24px;
		border-bottom: 1px solid var(--border);
	}

	.dash-topbar-right {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.dash-page-title {
		font-size: 20px;
		font-weight: 600;
	}

	.dash-content {
		padding: 20px 24px;
		flex: 1;
	}

	.dash-stat-card {
		text-align: center;
	}

	.dash-stat-value {
		font-size: 28px;
		font-weight: 800;
		margin: 4px 0;
	}

	.dash-stat-change {
		font-size: 13px;
		font-weight: 600;
	}

	.dash-card-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.dash-view-all {
		font-size: 13px;
		color: var(--primary);
		text-decoration: none;
	}

	.dash-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 14px;
	}

	.dash-table th {
		text-align: left;
		padding: 8px 10px;
		font-size: 12px;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: var(--fg); opacity: var(--op-muted);
		border-bottom: 1px solid var(--border);
	}

	.dash-table td {
		padding: 10px;
		border-bottom: 1px solid var(--border);
	}

	.dash-activity {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-top: 8px;
	}

	.dash-activity-item {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.dash-activity-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		margin-top: 5px;
		flex-shrink: 0;
	}

	/* Chart */
	.dash-chart {
		display: flex;
		align-items: flex-end;
		gap: 8px;
		height: 160px;
		margin-top: 16px;
	}

	.dash-bar-col {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		height: 100%;
		justify-content: flex-end;
	}

	.dash-bar {
		width: 100%;
		border-radius: 4px 4px 0 0;
		min-height: 4px;
	}

	.dash-bar-label {
		font-size: 11px;
		color: var(--fg); opacity: var(--op-muted);
		margin-top: 6px;
	}

	/* ---- Blog ---- */
	.blog-layout {
		max-width: 1100px;
		margin: 0 auto;
		padding: 40px 24px;
		display: grid;
		grid-template-columns: 1fr 300px;
		gap: 32px;
	}

	.blog-category {
		font-size: 13px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.blog-title {
		font-size: 36px;
		font-weight: 800;
		line-height: 1.15;
		margin-top: 8px;
	}

	.blog-meta {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 16px;
		font-size: 14px;
	}

	.blog-hero-img {
		height: 240px;
		border-radius: 10px;
		margin-top: 24px;
	}

	.blog-body {
		margin-top: 32px;
		font-size: 16px;
		line-height: 1.75;
	}

	.blog-body h2 {
		font-size: 24px;
		font-weight: 700;
		margin-top: 32px;
		margin-bottom: 12px;
	}

	.blog-body p {
		margin-bottom: 16px;
	}

	.blog-body ul {
		margin-bottom: 16px;
		padding-left: 20px;
	}

	.blog-body li {
		margin-bottom: 6px;
	}

	.blog-quote {
		border-left: 3px solid var(--accent);
		padding: 12px 20px;
		margin: 24px 0;
		font-size: 18px;
		color: var(--fg); opacity: var(--op-muted);
		font-style: italic;
	}

	.blog-callout {
		background: var(--surface);
		border: 1px solid var(--border);
		border-left: 3px solid var(--primary);
		border-radius: 6px;
		padding: 16px 20px;
		margin: 24px 0;
	}

	.blog-callout-title {
		font-size: 14px;
		font-weight: 700;
		color: var(--primary);
		margin-bottom: 6px;
	}

	.blog-callout p {
		margin: 0;
		font-size: 14px;
		color: var(--fg); opacity: var(--op-muted);
	}

	.blog-tags {
		display: flex;
		gap: 8px;
		margin-top: 32px;
		flex-wrap: wrap;
	}

	.blog-author-card {
		display: flex;
		gap: 14px;
		margin-top: 32px;
		padding: 20px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 10px;
	}

	.blog-sidebar {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.blog-cat-list {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-top: 8px;
	}

	.blog-cat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 6px 0;
		text-decoration: none;
		color: var(--fg);
		font-size: 14px;
		border-bottom: 1px solid var(--border);
	}

	.blog-cat-count {
		font-size: 11px;
		font-weight: 600;
		padding: 1px 8px;
		border-radius: 99px;
	}

	.blog-related {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-top: 8px;
	}

	.blog-related-item {
		display: flex;
		gap: 10px;
		text-decoration: none;
		color: var(--fg);
	}

	.blog-related-thumb {
		width: 48px;
		height: 48px;
		border-radius: 6px;
		flex-shrink: 0;
		opacity: 0.4;
	}

	/* Responsive */
	@media (max-width: 768px) {
		.page {
			flex-direction: column;
			height: auto;
			min-height: 100vh;
		}

		.sidebar {
			width: 100%;
			max-height: 40vh;
			border-right: none;
			border-bottom: 1px solid #333;
			flex-shrink: 0;
		}

		.demo-scroll {
			flex: 1;
			min-height: 0;
		}

		.audit-panel {
			width: 100%;
			border-left: none;
			border-top: 1px solid #333;
			max-height: 30vh;
		}

		.audit-panel-collapsed {
			width: 100%;
			max-height: 36px;
		}

		/* Landing page */
		.d-hero {
			padding: 40px 16px;
		}

		.d-hero-title {
			font-size: 28px;
		}

		.d-hero-sub {
			font-size: 15px;
		}

		.d-hero-actions {
			flex-direction: column;
			align-items: center;
		}

		.d-section {
			padding: 32px 16px;
		}

		.d-section-title {
			font-size: 24px;
		}

		.d-cards-2, .d-cards-3, .d-cards-4 {
			grid-template-columns: 1fr;
		}

		.d-stats-grid {
			grid-template-columns: 1fr 1fr;
		}

		.d-stat-num {
			font-size: 24px;
		}

		.d-footer-inner {
			grid-template-columns: 1fr 1fr;
			gap: 20px;
			padding: 24px 16px;
		}

		.d-nav-inner {
			padding: 10px 16px;
			gap: 12px;
		}

		.d-nav-links {
			gap: 12px;
		}

		.d-nav-links a {
			font-size: 13px;
		}

		/* Dashboard */
		.dash {
			flex-direction: column;
		}

		.dash-sidebar {
			width: 100%;
			border-right: none;
			border-bottom: 1px solid var(--border);
		}

		.dash-nav {
			flex-direction: row;
			overflow-x: auto;
			padding: 4px 8px;
		}

		.dash-nav-item {
			white-space: nowrap;
			padding: 6px 10px;
			font-size: 13px;
		}

		.dash-content {
			padding: 12px;
		}

		.dash-stat-value {
			font-size: 20px;
		}

		.dash-table {
			font-size: 12px;
		}

		.dash-table th, .dash-table td {
			padding: 6px;
		}

		/* Blog */
		.blog-layout {
			grid-template-columns: 1fr;
			padding: 20px 16px;
			gap: 24px;
		}

		.blog-title {
			font-size: 24px;
		}

		.blog-meta {
			flex-wrap: wrap;
			gap: 6px;
		}

		.blog-hero-img {
			height: 160px;
		}

		.blog-body {
			font-size: 15px;
		}

		.blog-body h2 {
			font-size: 20px;
		}
	}
</style>
