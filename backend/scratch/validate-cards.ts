import { SEED_STYLES } from '../src/services/cardStyles'
import { SEED_TEMPLATES } from '../src/services/cardTemplates'
import { styleTokensSchema, templateDefinitionSchema, describeZodError } from '../src/schema/cardSchema'

let failed = 0
for (const s of SEED_STYLES) {
  const r = styleTokensSchema.safeParse(s.tokens)
  if (!r.success) { failed++; console.log(`STYLE ${s.id}: ${describeZodError(r.error)}`) }
}
for (const t of SEED_TEMPLATES) {
  const r = templateDefinitionSchema.safeParse(t.definition)
  if (!r.success) {
    failed++
    console.log(`TEMPLATE ${t.id}:`)
    for (const i of r.error.issues.slice(0, 6)) console.log(`   ${i.path.join('.')} — ${i.message}`)
  }
}
console.log(failed === 0 ? `OK — ${SEED_STYLES.length} styles, ${SEED_TEMPLATES.length} templates valid` : `${failed} invalid`)
