import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { ABILITY_ATOMS, effectsFromAbilityIds } from './abilityAtoms.js';
import { ROLE_STAR_LADDERS } from './roleStarTracks.js';
import { summarizeStarEffect } from './starTypes.js';

describe('ability atoms', () => {
  it('every role-ladder ability id resolves', () => {
    for (const nodes of Object.values(ROLE_STAR_LADDERS)) {
      for (const node of nodes) {
        for (const fx of node.effects) {
          assert.ok(fx.kind, `empty effect on ★${node.star} ${node.label}`);
        }
      }
    }
    assert.ok(effectsFromAbilityIds(['a_main_pct_s', 'g_stun']).length === 2);
  });

  it('unknown id throws', () => {
    assert.throws(() => effectsFromAbilityIds(['not_an_atom']), /unknown ability atom/);
  });

  it('new distinct verbs are N-tier atoms', () => {
    const ids = [
      'f_slow',
      'f_heal_block',
      'f_mark_prey',
      'g_sleep',
      'g_havoc',
      'g_berserk',
      'h_shield',
      'h_atk_up',
      'h_def_up',
      'h_spd_up',
      'i_hot',
      'i_heal_on_kill',
      'e_vs_cc',
      'e_vs_high_hp',
      'k_grant_qi',
      'b_fortune',
      'e_self_low',
      'e_vs_rank',
      'e_surround',
      'e_focus_streak',
      'i_atonement',
      'i_heal_from_taken',
      'h_stagger',
      'h_earth_shield',
      'f_unstable',
    ];
    for (const id of ids) {
      assert.ok(ABILITY_ATOMS[id], `missing atom ${id}`);
    }
    assert.equal(ABILITY_ATOMS.h_atk_up.effect.kind, 'effect_unlock');
    assert.equal(ABILITY_ATOMS.i_hot.effect.kind, 'effect_unlock');
  });

  it('catalog-active verbs all resolve as atoms', () => {
    const ids = [
      'a_hp_pct',
      'a_atk_phys',
      'a_atk_spirit',
      'a_def_phys',
      'a_def_spirit',
      'a_spd_edge',
      'a_vers_wall',
      'a_final_edge',
      'b_haste',
      'b_crit_resist',
      'c_heal_mult',
      'c_guard_mult',
      'c_aoe_mult',
      'c_single_mult',
      'd_follow_heal',
      'd_follow_shred',
      'd_extra_hit_front',
      'd_on_kill_follow',
      'd_counter_follow',
      'e_vs_low_hp',
      'e_back_bonus',
      'e_overkill_col',
      'f_bleed_deep',
      'f_poison',
      'f_burn',
      'f_frostbite',
      'f_atk_down',
      'f_corruption',
      'g_freeze',
      'g_root',
      'g_taunt',
      'g_disarm',
      'h_crit_up',
      'h_immortal_brief',
      'h_share_dmg',
      'h_link_heal',
      'h_stealth_next',
      'i_heal_st',
      'i_heal_aoe',
      'i_heal_on_skill',
      'i_cleanse_team',
      'j_strip_buff',
      'j_break_guard',
      'j_cleanse_self',
      'k_qi_start',
      'k_qi_on_hit',
      'k_qi_steal',
      'k_basic_qi_up',
      'l_pierce',
      'l_row_front',
      'l_col',
      'l_focus_back',
      'l_focus_front',
      'l_ally_lowest',
      'l_cover_front',
      'l_cell_lock',
      'l_swap_threat',
      'm_execute',
      'm_second_wind',
      'm_clone_hit',
      'm_time_rewind',
      'm_steal_buff',
      'm_reflect_cc',
      'm_dmg_cap',
      'm_stack_dao',
      'm_blood_pact',
      'm_guardian_oath',
      'm_domain_lite',
      'm_mark_pop',
      'm_fate_lock',
      'j_transfer_debuff',
      'k_qi_drought',
      'm_fortune_strike',
    ];
    for (const id of ids) {
      assert.ok(ABILITY_ATOMS[id], `missing atom ${id}`);
    }
    assert.ok(!ABILITY_ATOMS.j_interrupt, 'merged id must stay dead');
    assert.ok(!ABILITY_ATOMS.j_reveal, 'merged id must stay dead');
    const extra = effectsFromAbilityIds(['d_follow_shred', 'm_stack_dao']);
    assert.ok(extra.some((e) => e.kind === 'enable_follow_up'));
    assert.ok(extra.some((e) => e.kind === 'status_unlock'));
    assert.ok(extra.some((e) => e.kind === 'effect_unlock'));
  });

  it('unlock summaries include the atom numbers', () => {
    const revive = summarizeStarEffect(ABILITY_ATOMS.m_revive_ally.effect);
    assert.match(revive, /招魂/);
    assert.match(revive, /35%/);
    assert.doesNotMatch(revive, /^解锁/);
    const cleanse = summarizeStarEffect(ABILITY_ATOMS.i_cleanse.effect);
    assert.match(cleanse, /净化/);
    assert.match(cleanse, /1道/);
    const shred = summarizeStarEffect(ABILITY_ATOMS.f_shred.effect);
    assert.match(shred, /破甲/);
    assert.match(shred, /防御×88%/);
    const silence = summarizeStarEffect(ABILITY_ATOMS.g_silence.effect);
    assert.match(silence, /55%/);
    assert.match(silence, /命中率/);
    const qi = summarizeStarEffect(ABILITY_ATOMS.k_ally_qi.effect);
    assert.match(qi, /灌气 \+8/);
    for (const atom of Object.values(ABILITY_ATOMS)) {
      const line = summarizeStarEffect(atom.effect);
      assert.ok(line.length > 0, atom.id);
      if (atom.effect.kind === 'effect_unlock') {
        const e = atom.effect.effect;
        if (e.value != null || e.multiplier != null) {
          assert.match(line, /\d/, `${atom.id} missing number: ${line}`);
        }
      }
      if (atom.effect.kind === 'status_unlock') {
        const s = atom.effect.status;
        if (s.duration != null || s.chance != null || s.value != null || s.layers != null) {
          assert.match(line, /\d/, `${atom.id} missing number: ${line}`);
        }
      }
    }
  });
});
