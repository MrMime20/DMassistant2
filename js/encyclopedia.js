let currentCategoryData = []; 

// Custom Whitelisted Safe Images to prevent inappropriate standard assets from loading
const IMAGE_OVERWRITE_MAP = {
    "/api/images/monsters/aboleth.png": "images/Aboleth.png",
    "/api/images/monsters/air-elemental.png": "images/Air_Elemental.png",
    "/api/images/monsters/androsphinx.png": "images/Androsphinx.png",
    "/api/images/monsters/animated-armor.png": "images/Animated_Armor.png",
    "/api/images/monsters/awakened-shrub.png": "images/Awakened_Shrub.png",
    "/api/images/monsters/dryad.png": "images/Dryad.png",
    "/api/images/monsters/guardian-naga.png": "images/Guardian_Naga.png",
    "/api/images/monsters/medusa.png": "images/Medusa.png"
};

function getSafeMonsterImage(imagePath) {
    if (!imagePath) return null;
    if (IMAGE_OVERWRITE_MAP[imagePath]) {
        return IMAGE_OVERWRITE_MAP[imagePath];
    }
    if (imagePath.startsWith("http")) {
        return imagePath;
    }
    return `https://www.dnd5eapi.co${imagePath}`;
}

async function loadEncyclopediaCategory() {
    const category = document.getElementById("encCategory").value;
    const listContainer = document.getElementById("encIndexList");
    
    listContainer.innerHTML = `<div class="enc-placeholder-msg">Loading index...</div>`;
    document.getElementById("encSearch").value = "";
    document.getElementById("encContent").innerHTML = `<div class="enc-placeholder-msg">Select an entry from the encyclopedia to view its details.</div>`;

    if (category === "favorites") {
        currentCategoryData = state.favorites || [];
    } else {
        try {
            const res = await fetch(`https://www.dnd5eapi.co/api/${category}`);
            const data = await res.json();
            const apiResults = data.results || [];
                        
            currentCategoryData = [...apiResults];
        } catch(e) {
            listContainer.innerHTML = `<div class="enc-placeholder-msg">Failed to load category index.</div>`;
            return;
        }
    }

    filterEncyclopedia();
}

function filterEncyclopedia() {
    const query = document.getElementById("encSearch").value.toLowerCase().trim();
    let filtered = currentCategoryData || [];

    if (query) {
        filtered = filtered.filter(item => item && item.name && item.name.toLowerCase().includes(query));
    }

    renderEncList(filtered);
}

function renderEncList(items) {
    const listContainer = document.getElementById("encIndexList");
    listContainer.innerHTML = "";

    const safeItems = items || [];
    if (safeItems.length === 0) {
        listContainer.innerHTML = `<div class="enc-placeholder-msg">No results found.</div>`;
        return;
    }

    for (const item of safeItems) {
        if (!item || !item.name) continue;
        const row = document.createElement("div");
        row.className = "enc-list-item";
        
        row.innerHTML = `<div style="display: flex; align-items: center;"><span>${item.name}</span></div> <i data-lucide="arrow-right" style="width:14px; opacity:0.5;"></i>`;
        
        row.onclick = () => {
            document.querySelectorAll(".enc-list-item").forEach(el => el.classList.remove("active"));
            row.classList.add("active");
            fetchAndRenderDetails(item.url, item.name);
        };
        
        listContainer.appendChild(row);
    }

    if (window.lucide) lucide.createIcons();
}

async function fetchAndRenderDetails(url, itemName) {
    const content = document.getElementById("encContent");
    content.innerHTML = `<div class="enc-placeholder-msg">Scrying details...</div>`;

    try {
        let detail;
        const res = await fetch(`https://www.dnd5eapi.co${url}`);
        detail = await res.json();
        
        const favoritesList = state.favorites || [];
        const isFav = favoritesList.some(f => f && f.url === url);
        const iconColor = isFav ? "var(--gold)" : "var(--text-muted)";
        const fillMode = isFav ? "var(--gold)" : "none";
        const safeName = itemName.replace(/'/g, "\\'");

        // Build Master Header
        let html = `
            <div class="enc-detail-header">
                <div>
                    <div class="enc-detail-subtitle">${getSubtitle(detail)}</div>
                    <div class="enc-detail-title">${detail.name || itemName}</div>
                </div>
                <button class="fav-btn" onclick="toggleFavorite('${safeName}', '${url}')" title="Toggle Favorite">
                    <i data-lucide="star" style="color: ${iconColor}; fill: ${fillMode}"></i>
                </button>
            </div>
        `;

        // Check for Custom D&D Specific Layouts
        let customLayoutHtml = null;
        if (url.includes("/monsters/")) {
            customLayoutHtml = renderMonster(detail);
        } else if (url.includes("/spells/")) {
            customLayoutHtml = renderSpell(detail);
        } else if (url.includes("/equipment/") || url.includes("/magic-items/")) {
            customLayoutHtml = renderEquipment(detail);
        }

        // Apply custom layout if exists, fallback to standard parsing
        if (customLayoutHtml) {
            html += customLayoutHtml;
        } else {
            html += `<div class="enc-section">${parseObjectToHTML(detail)}</div>`;
        }

        content.innerHTML = html;
        if (window.lucide) lucide.createIcons();

    } catch(e) {
        content.innerHTML = `<div class="enc-placeholder-msg" style="color: var(--danger)">Error loading details.</div>`;
    }
}

// ==============================================
// CUSTOM LAYOUT ENGINES
// ==============================================

function getModifier(score) {
    const mod = Math.floor((score - 10) / 2);
    return mod >= 0 ? `+${mod}` : `${mod}`;
}

function getUsage(usage) {
    if (!usage) return '';
    if (usage.type === 'recharge on roll') return ` (Recharge ${usage.min_value}-${usage.dice || 6})`;
    return ` (${usage.type})`;
}

function renderMonster(detail) {
    let html = `<div class="stat-block">`;
    
    const safeImg = getSafeMonsterImage(detail.image);
    if (safeImg) {
         html += `<img src="${safeImg}" alt="${detail.name}" class="stat-img" />`;
    }
    
    // AC
    let acStr = '10';
    if (detail.armor_class && detail.armor_class.length > 0) {
        acStr = detail.armor_class.map(ac => {
            if (typeof ac === 'number') return ac;
            let typeStr = "";
            if (ac.type) typeStr = ` (${ac.type}${ac.type === 'natural' ? ' armor' : ''})`;
            if (ac.armor && ac.armor.length > 0) typeStr = ` (${ac.armor.map(a => a.name).join(', ')})`;
            return `${ac.value}${typeStr}`;
        }).join(', ');
    }
    html += `<div class="property-line"><strong>Armor Class</strong> ${acStr}</div>`;
    
    // HP
    html += `<div class="property-line"><strong>Hit Points</strong> ${detail.hit_points || ''} ${detail.hit_points_roll ? `(${detail.hit_points_roll})` : ''}</div>`;
    
    // Speed
    let speedStr = '30 ft.';
    if (detail.speed) {
        speedStr = Object.entries(detail.speed).map(([k,v]) => k === 'hover' && v === true ? 'hover' : `${k} ${v}`).join(', ');
    }
    html += `<div class="property-line"><strong>Speed</strong> ${speedStr}</div>`;
    
    html += `<hr class="tapered-rule">`;
    
    // Ability Scores Grid
    html += `<div class="ability-scores">`;
    ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'].forEach(attr => {
        const score = detail[attr] || 10;
        const mod = getModifier(score);
        const short = attr.substring(0,3).toUpperCase();
        html += `<div class="ability-score"><strong>${short}</strong> <span>${score} (${mod})</span></div>`;
    });
    html += `</div>`;
    
    html += `<hr class="tapered-rule">`;
    
    // Saves & Skills from proficiencies
    let saves = [], skills = [];
    if (detail.proficiencies) {
        detail.proficiencies.forEach(p => {
            if (p.proficiency.index.startsWith('saving-throw-')) saves.push(`${p.proficiency.name.replace('Saving Throw: ', '')} +${p.value}`);
            if (p.proficiency.index.startsWith('skill-')) skills.push(`${p.proficiency.name.replace('Skill: ', '')} +${p.value}`);
        });
    }
    if (saves.length > 0) html += `<div class="property-line"><strong>Saving Throws</strong> ${saves.join(', ')}</div>`;
    if (skills.length > 0) html += `<div class="property-line"><strong>Skills</strong> ${skills.join(', ')}</div>`;
    
    // Vulnerabilities, Resistances, Immunities
    if (detail.damage_vulnerabilities?.length > 0) html += `<div class="property-line"><strong>Damage Vulnerabilities</strong> ${detail.damage_vulnerabilities.join(', ')}</div>`;
    if (detail.damage_resistances?.length > 0) html += `<div class="property-line"><strong>Damage Resistances</strong> ${detail.damage_resistances.join(', ')}</div>`;
    if (detail.damage_immunities?.length > 0) html += `<div class="property-line"><strong>Damage Immunities</strong> ${detail.damage_immunities.join(', ')}</div>`;
    if (detail.condition_immunities?.length > 0) {
        let cond = detail.condition_immunities.map(c => typeof c === 'string' ? c : c.name).join(', ');
        html += `<div class="property-line"><strong>Condition Immunities</strong> ${cond}</div>`;
    }
    
    // Senses
    let senses = [];
    if (detail.senses) {
        Object.entries(detail.senses).forEach(([k,v]) => senses.push(`${k.replace(/_/g, ' ')} ${v}`));
    }
    if (senses.length > 0) html += `<div class="property-line"><strong>Senses</strong> ${senses.join(', ')}</div>`;
    
    if (detail.languages) html += `<div class="property-line"><strong>Languages</strong> ${detail.languages}</div>`;
    if (detail.challenge_rating !== undefined) html += `<div class="property-line"><strong>Challenge</strong> ${detail.challenge_rating} ${detail.xp ? `(${detail.xp} XP)` : ''}</div>`;
    if (detail.proficiency_bonus) html += `<div class="property-line"><strong>Proficiency Bonus</strong> +${detail.proficiency_bonus}</div>`;
    
    html += `<hr class="tapered-rule">`;
    
    // Special Abilities / Traits
    if (detail.special_abilities) {
        detail.special_abilities.forEach(ability => {
            const descriptionParsed = ability.desc ? (Array.isArray(ability.desc) ? ability.desc.join("\n\n") : ability.desc) : "";
            html += `<div class="property-block"><strong><em>${ability.name}${getUsage(ability.usage)}.</em></strong> ${marked.parseInline(descriptionParsed)}</div>`;
        });
    }
    
    // Actions
    if (detail.actions && detail.actions.length > 0) {
        html += `<h3 class="section-header">Actions</h3>`;
        detail.actions.forEach(action => {
             const descriptionParsed = action.desc ? (Array.isArray(action.desc) ? action.desc.join("\n\n") : action.desc) : "";
             html += `<div class="property-block"><strong><em>${action.name}${getUsage(action.usage)}.</em></strong> ${marked.parseInline(descriptionParsed)}</div>`;
        });
    }
    
    // Reactions
    if (detail.reactions && detail.reactions.length > 0) {
        html += `<h3 class="section-header">Reactions</h3>`;
        detail.reactions.forEach(reaction => {
             const descriptionParsed = reaction.desc ? (Array.isArray(reaction.desc) ? reaction.desc.join("\n\n") : reaction.desc) : "";
             html += `<div class="property-block"><strong><em>${reaction.name}${getUsage(reaction.usage)}.</em></strong> ${marked.parseInline(descriptionParsed)}</div>`;
        });
    }
    
    // Legendary Actions
    if (detail.legendary_actions && detail.legendary_actions.length > 0) {
        html += `<h3 class="section-header">Legendary Actions</h3>`;
        html += `<div class="property-block">The monster can take 3 legendary actions, choosing from the options below. Only one legendary action option can be used at a time and only at the end of another creature's turn. The monster regains spent legendary actions at the start of its turn.</div>`;
        detail.legendary_actions.forEach(action => {
             const descriptionParsed = action.desc ? (Array.isArray(action.desc) ? action.desc.join("\n\n") : action.desc) : "";
             html += `<div class="property-block"><strong><em>${action.name}.</em></strong> ${marked.parseInline(descriptionParsed)}</div>`;
        });
    }

    html += `</div>`;
    
    // Catch-All Engine for unmapped data (Prevents Data Loss)
    const knownKeys = ['_id', 'index', 'url', 'name', 'size', 'type', 'subtype', 'alignment', 'armor_class', 'hit_points', 'hit_points_roll', 'hit_dice', 'speed', 'strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma', 'proficiencies', 'damage_vulnerabilities', 'damage_resistances', 'damage_immunities', 'condition_immunities', 'senses', 'languages', 'challenge_rating', 'xp', 'special_abilities', 'actions', 'reactions', 'legendary_actions', 'image', 'proficiency_bonus'];
    
    let remainingData = {};
    let hasRemaining = false;
    for (let k in detail) {
        if (!knownKeys.includes(k)) {
            remainingData[k] = detail[k];
            hasRemaining = true;
        }
    }
    if (hasRemaining) {
        html += `<div class="enc-section" style="margin-top:20px;">
                    <h3 style="color: var(--text); border-bottom: 1px solid var(--border); padding-bottom: 8px; margin-bottom: 12px;">Additional Info</h3>
                    ${parseObjectToHTML(remainingData)}
                 </div>`;
    }
    
    return html;
}

function renderSpell(detail) {
    let html = `<div class="stat-block">`;
    
    html += `<div class="property-line"><strong>Casting Time:</strong> ${detail.casting_time}</div>`;
    html += `<div class="property-line"><strong>Range:</strong> ${detail.range}</div>`;
    
    let compStr = detail.components?.join(', ') || '';
    if (detail.material) compStr += ` (${detail.material})`;
    html += `<div class="property-line"><strong>Components:</strong> ${compStr}</div>`;
    
    html += `<div class="property-line"><strong>Duration:</strong> ${detail.concentration ? 'Concentration, up to ' : ''}${detail.duration}</div>`;
    
    if (detail.classes && detail.classes.length > 0) {
        html += `<div class="property-line"><strong>Classes:</strong> ${detail.classes.map(c => c.name).join(', ')}</div>`;
    }
    
    html += `<hr class="tapered-rule">`;
    
    if (detail.desc) {
        detail.desc.forEach(p => {
            html += `<div class="property-block">${marked.parse(p)}</div>`;
        });
    }
    
    if (detail.higher_level) {
        html += `<div class="property-block"><strong><em>At Higher Levels.</em></strong> ${marked.parseInline(detail.higher_level.join('\n'))}</div>`;
    }

    html += `</div>`;

    // Catch-All
    const knownKeys = ['_id', 'index', 'url', 'name', 'desc', 'higher_level', 'range', 'components', 'material', 'ritual', 'duration', 'concentration', 'casting_time', 'level', 'attack_type', 'damage', 'school', 'classes', 'subclasses'];
    let remainingData = {};
    let hasRemaining = false;
    for (let k in detail) {
        if (!knownKeys.includes(k)) {
            remainingData[k] = detail[k];
            hasRemaining = true;
        }
    }
    if (hasRemaining) {
        html += `<div class="enc-section" style="margin-top:20px;">${parseObjectToHTML(remainingData)}</div>`;
    }
    return html;
}

function renderEquipment(detail) {
    let html = `<div class="stat-block">`;
    
    let topStats = [];
    if (detail.equipment_category) topStats.push(detail.equipment_category.name);
    if (detail.vehicle_category) topStats.push(detail.vehicle_category);
    if (detail.weapon_category) topStats.push(detail.weapon_category + ' Weapon');
    if (detail.armor_category) topStats.push(detail.armor_category + ' Armor');
    
    if (topStats.length > 0) {
         html += `<em>${topStats.join(', ')}</em><hr class="tapered-rule">`;
    }
    
    if (detail.cost) html += `<div class="property-line"><strong>Cost:</strong> ${detail.cost.quantity} ${detail.cost.unit}</div>`;
    if (detail.weight) html += `<div class="property-line"><strong>Weight:</strong> ${detail.weight} lb.</div>`;
    
    if (detail.armor_class) {
         html += `<div class="property-line"><strong>Armor Class (AC):</strong> ${detail.armor_class.base} ${detail.armor_class.dex_bonus ? '+ Dex modifier' : ''} ${detail.armor_class.max_bonus ? `(max ${detail.armor_class.max_bonus})` : ''}</div>`;
    }
    if (detail.str_minimum) html += `<div class="property-line"><strong>Strength Requirement:</strong> ${detail.str_minimum}</div>`;
    if (detail.stealth_disadvantage) html += `<div class="property-line"><strong>Stealth:</strong> Disadvantage</div>`;
    
    if (detail.damage) {
        let dmgStr = `${detail.damage.damage_dice} ${detail.damage.damage_type?.name || ''}`;
        html += `<div class="property-line"><strong>Damage:</strong> ${dmgStr}</div>`;
    }
    if (detail.two_handed_damage) {
        html += `<div class="property-line"><strong>Two-Handed Damage:</strong> ${detail.two_handed_damage.damage_dice} ${detail.two_handed_damage.damage_type?.name || ''}</div>`;
    }
    
    if (detail.properties && detail.properties.length > 0) {
        html += `<div class="property-line"><strong>Properties:</strong> ${detail.properties.map(p => p.name).join(', ')}</div>`;
    }
    
    if (detail.desc) {
        html += `<hr class="tapered-rule">`;
        let descArr = Array.isArray(detail.desc) ? detail.desc : [detail.desc];
        descArr.forEach(p => {
            html += `<div class="property-block">${marked.parse(p)}</div>`;
        });
    }

    html += `</div>`;

    // Catch-All
    const knownKeys = ['_id', 'index', 'url', 'name', 'equipment_category', 'vehicle_category', 'weapon_category', 'weapon_range', 'category_range', 'cost', 'damage', 'two_handed_damage', 'range', 'weight', 'properties', 'throw_range', 'armor_category', 'armor_class', 'str_minimum', 'stealth_disadvantage', 'desc', 'contents'];
    let remainingData = {};
    let hasRemaining = false;
    for (let k in detail) {
        if (!knownKeys.includes(k)) {
            remainingData[k] = detail[k];
            hasRemaining = true;
        }
    }
    if (hasRemaining) {
        html += `<div class="enc-section" style="margin-top:20px;">${parseObjectToHTML(remainingData)}</div>`;
    }
    return html;
}

// ==============================================
// UTILITIES & RECURSIVE PARSER
// ==============================================

function getSubtitle(detail) {
    if (detail.level !== undefined && detail.school) return `Level ${detail.level} ${detail.school.name || detail.school}`;
    if (detail.size && detail.type) return `${detail.size} ${detail.type}, ${detail.alignment || 'unaligned'}`;
    if (detail.equipment_category) return detail.equipment_category.name || detail.equipment_category;
    return "Archive Entry";
}

function parseObjectToHTML(obj, depth = 0) {
    if (!obj) return "";
    let html = "";

    const ignoreKeys = ["index", "url", "name"];
    let kvGridObj = {};
    const kvKeys = ["armor_class", "hit_points", "speed", "challenge_rating", "xp", "cost", "weight", "casting_time", "range", "duration", "components", "hit_die", "full_name", "abbreviation", "prerequisites", "type", "size"];

    if (depth === 0) {
        for (const k of kvKeys) {
            if (obj[k] !== undefined) {
                kvGridObj[k] = obj[k];
                ignoreKeys.push(k);
            }
        }
        if (Object.keys(kvGridObj).length > 0) {
            html += `<div class="enc-kv-grid">`;
            for (const [k, v] of Object.entries(kvGridObj)) {
                const formattedVal = Array.isArray(v) ? v.map(formatSimpleValue).join(', ') : formatSimpleValue(v);
                html += `<div class="enc-kv-box"><div class="enc-kv-label">${k.replace(/_/g, " ")}</div><div class="enc-kv-value">${formattedVal}</div></div>`;
            }
            html += `</div>`;
        }
    }

    for (const [key, value] of Object.entries(obj)) {
        if (depth === 0 && ignoreKeys.includes(key)) continue;

        const displayTitle = key.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

        if (key === "image") {
            const safeImg = getSafeMonsterImage(value);
            if (safeImg) {
                html += `<img src="${safeImg}" alt="Visual Image" style="max-width: 100%; border-radius: 12px; margin-bottom: 16px; border: 1px solid var(--border); box-shadow: var(--shadow);" />`;
            }
        } else if (key === "desc" || key === "higher_level") {
            const txt = Array.isArray(value) ? value.join("\n\n") : value;
            if (depth === 0) html += `<h3>${displayTitle}</h3>`;
            html += `<div style="margin-bottom: 16px; line-height: 1.7; color: var(--text-muted);">${marked.parse(txt)}</div>`;
        } else if (Array.isArray(value)) {
            if (value.length === 0) continue;
            if (typeof value[0] === "string") {
                html += `<h3>${displayTitle}</h3><ul style="margin-left: 20px; margin-bottom: 16px;">${value.map(v => `<li style="margin-bottom:6px; line-height:1.6;">${marked.parseInline(v)}</li>`).join('')}</ul>`;
            } else if (value[0].name && value[0].desc) {
                html += `<h3>${displayTitle}</h3>`;
                value.forEach(v => {
                    const descText = Array.isArray(v.desc) ? v.desc.join("\n\n") : v.desc;
                    html += `<div style="margin-bottom: 14px; line-height:1.6;"><strong>${v.name}.</strong> ${marked.parseInline(descText)}</div>`;
                });
            } else {
                html += `<h3>${displayTitle}</h3><ul style="margin-left: 20px; margin-bottom: 16px;">`;
                value.forEach(v => {
                    html += `<li style="margin-bottom:6px; line-height:1.6;">${formatSimpleValue(v)}</li>`;
                });
                html += `</ul>`;
            }
        } else if (typeof value === "object" && value !== null) {
             html += `<h3>${displayTitle}</h3> <div style="margin-left:16px; border-left: 2px solid var(--border); padding-left: 12px; margin-bottom: 16px;">${parseObjectToHTML(value, depth + 1)}</div>`;
        } else {
             html += `<p style="margin-bottom:12px; line-height:1.6;"><strong>${displayTitle}:</strong> <span style="color: var(--text-muted);">${value}</span></p>`;
        }
    }
    return html;
}

function formatSimpleValue(val) {
    if (typeof val !== "object" || val === null) return val;
    if (typeof val.desc === "string") return val.desc;

    if (val.equipment && val.quantity) return `${val.quantity}x ${val.equipment.name || val.equipment}`;
    if (val.proficiency && val.value) return `${val.proficiency.name || val.proficiency} (+${val.value})`;
    if (val.ability_score && val.minimum_score) return `${val.ability_score.name || val.ability_score} (Min: ${val.minimum_score})`;
    if (val.ability_score && val.bonus) return `${val.ability_score.name || val.ability_score} (+${val.bonus})`;
    
    if (val.spell) {
        let prereqStr = "";
        if (val.prerequisites && Array.isArray(val.prerequisites) && val.prerequisites.length > 0) {
            prereqStr = ` (Prereq: ${val.prerequisites.map(p => p.name || p).join(', ')})`;
        }
        return `${val.spell.name || val.spell}${prereqStr}`;
    }

    if (val.damage_type) {
        let str = val.damage_type.name || val.damage_type;
        if (val.damage_at_character_level) {
            const levels = Object.entries(val.damage_at_character_level).map(([lvl, dmg]) => `Lvl ${lvl}: ${dmg}`).join(', ');
            str += ` (${levels})`;
        } else if (val.damage_dice) {
            str += ` (${val.damage_dice})`;
        }
        return str;
    }

    if (val.type && val.value !== undefined) {
        let str = `${val.type.charAt(0).toUpperCase() + val.type.slice(1)} (AC ${val.value})`;
        if (val.armor && Array.isArray(val.armor) && val.armor.length > 0) str += ` - ${val.armor.map(a => a.name || a).join(', ')}`;
        return str;
    }

    if (val.item && val.item.name) return val.item.name;
    if (val.name) return val.name; 

    if (val.walk !== undefined) {
        let speeds = [];
        for (const [k, v] of Object.entries(val)) speeds.push(`${k}: ${v}`);
        return speeds.join(', ');
    }
    
    if (val.quantity && val.unit) return `${val.quantity} ${val.unit}`;

    const parts = [];
    for (const [k, v] of Object.entries(val)) {
        if (k === 'url' || k === 'index') continue;
        if (typeof v !== 'object') parts.push(`${k}: ${v}`);
        else if (v && v.name) parts.push(`${k}: ${v.name}`);
    }
    
    if (parts.length > 0 && parts.length < 6) return parts.join(" | ");

    return JSON.stringify(val);
}

function toggleFavorite(name, url) {
    if (!state.favorites || !Array.isArray(state.favorites)) {
        state.favorites = [];
    }
    const index = state.favorites.findIndex(f => f && f.url === url);
    if (index > -1) {
        state.favorites.splice(index, 1);
    } else {
        state.favorites.push({ name, url });
    }
    saveState();
    fetchAndRenderDetails(url, name);
    if (document.getElementById("encCategory").value === "favorites") {
        loadEncyclopediaCategory();
    }
}
