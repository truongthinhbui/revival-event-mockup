# Latest approved flow change

The user's latest instruction supersedes the automatic activity-point rule below: completed activity tasks now require a manual Claim. Progress completion alone does not add points. After Claim, activity points are added once and the task becomes DONE. Login still grants 4 points automatically. Task-point claims are additional interactions, separate from the seven login gift and five milestone reward claims.

The supplied Halloween Chick image is now the fixed D7 Apex artwork: silhouette with a question mark on day 1, revealed artwork from event day 2. The supplied blue circular icon represents activity points, not a spendable event-shop currency. Claimed points fly into the current upper endpoint of the filled milestone rail; milestone rewards remain separate manual claims and points are not spent.

Historical v0.5 audit follows; automatic-activity-point statements in it describe the earlier GDD, not this latest approved prototype revision.
# Revival Event v0.5 — applied to both concepts

Source of truth: the user's full GDD v0.5 dated 28/10/2026. This supersedes the earlier requested task-point Claim interaction.

## Corrected in both HTML concepts

- Shared runtime: revival-gdd-engine.js. Both concepts use the same local event state and reward model.
- Login automatically grants 4 points once per UTC day. Activity completion automatically grants points; task rows have progress or DONE, with no GO or task Claim button.
- Seven activity rows, up to 26 activity points plus login, capped at 30 daily points. The demo weights sum to 26; task targets/weights remain sample configuration.
- Buying 5 pets completes Buy 3 and Buy 5 from shared purchase progress, including the sample existing-shop path. Reward pets, failed steals and free upgrades are ignored. Paid levels and online seconds have separate input events.
- Daily task variants record current RB when the board first opens and keep that board RB until reset. Concrete variant definitions remain configuration-dependent.
- Seven manual daily rewards: D1 pet, D2 pet, Spins, Dust, MutaGen, CashD6, Apex. Availability and claim state are rendered per day; unclaimed earlier gifts remain available until expiry.
- Reveal state persists from event day 2. The actual configured Apex identity is missing, so the hero retains its placeholder artwork and labels it as revealed without inventing a species.
- Five independent manual milestones: 15 Cash15, 40 Clover SS MutaGen, 60 4h MoneyTime, 75 Cash75, 90 Thundered SS WeatherGen ×5. Each unlocks once, shows Claim then DONE. Points are not consumed and there is no extra reward beyond 90.
- Entry RB and reward row are saved once. Later current-RB changes do not select a new reward row. Claimed daily and milestone rewards persist separately.
- Full base blocks pet delivery and leaves the gift unclaimed; clearing the prototype full-base flag allows retry. Event pets are modeled as Lv1, Normal, no Weather.
- Flat cash uses saved configuration values, never income or current RB. Missing values remain symbolic configured rewards; the prototype does not fabricate cash amounts.
- MoneyTime uses income at claim × 14,400 seconds with a maximum of 4h and respects the money cap. Configured flat money also respects the normal cap when values are supplied.
- UTC task reset clears daily progress, daily point/login state and board RB, retaining event total, reward row, reveals and claims. Automatic login points are granted on the new day.
- Event expires 7 days after entry, without missed-day extension. Expired claims are rejected. A live countdown replaces the static screenshot timer.
- Reconnect restores localStorage state. The two concepts synchronize the same event across tabs via the storage event. This is local prototype persistence, not server-backed delivery.
- Initial eligibility model checks inactive 7+ days, RB6+, and an already-entered guard. Demo controls can reset this local prototype intentionally; a real per-account event guard must be server-authoritative.

## Configuration still required

1. Full return-RB reward table, including actual D1/D2/Apex identities, exact quantities and Cash15/Cash75/CashD6 amounts.
2. Literal near-max-RB item substitutions from that same table. No substitutions were invented.
3. Exact seven activity definitions, targets, weights and RB variants. The old source task-panel screenshots awarded Shop Event tokens and are not a complete Revival activity specification.
4. Existing Revival login-day advancement rules. The prototype's explicit demo action advances event day separately from UTC reset, so it does not assume a missed-day/login-calendar rule.
5. Production money cap, income state, inventory capacity, rebirth fees and required pet copies. The model supports cash caps and pet-capacity state; it does not implement a second rebirth economy.

## Production integration boundaries

- Use the existing Tailor Shop and normal prices. The bottom shop link and existing shop screenshot are retained; the production link beside the rebirth requirements belongs on the actual rebirth screen, which has not been supplied as an editable screen/configuration.
- Rebirth must deduct only its fee and required pet copies. No prototype action wipes money or pets. Actual rebirth transactions are not connected.
- Returning-player eligibility, event-entry uniqueness and reward delivery must be atomic and server-authoritative. LocalStorage is only for this prototype.
- Replace old Revival Login and Revival Playtime entry/rewards in production. These prototypes do not add a separate old-playtime award.
- The balance goals (90% first rebirth D1; about 75% two by D4; about 50% three by D7) cannot be verified without economy data and player simulation/telemetry.

## Validation

work/check-gdd-v05.cjs verifies eligibility, automatic login, shared purchase tasks, excluded actions, daily cap, fixed entry row and board RB, UTC reset, D2 reveal, full-base retry, all five once-only milestones, non-spent points, flat money, claim-time MoneyTime and cap, expiry, serialization and both HTML asset references.

All UI remains English. Existing game icons and the GFF Latin font remain in place; missing reward identities/art are placeholders.

