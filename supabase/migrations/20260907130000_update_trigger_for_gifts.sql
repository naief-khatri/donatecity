CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_city_id UUID;
  v_gift RECORD;
  v_sequence INTEGER := 1;
  v_total_donated NUMERIC := 0;
  v_campaigns INTEGER := 0;
  v_causes INTEGER := 0;
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (new.id, split_part(new.email, '@', 1) || '_' || substr(md5(random()::text), 1, 6));
  
  -- Create a default city for the user
  INSERT INTO public.cities (owner_id, name)
  VALUES (new.id, split_part(new.email, '@', 1) || '''s City')
  RETURNING id INTO v_city_id;

  -- Claim any gifted donations
  FOR v_gift IN SELECT * FROM public.gifted_donations WHERE target_email = new.email AND claimed = false LOOP
    INSERT INTO public.donations (user_id, city_id, campaign_slug, campaign_name, organization_name, cause, amount, charge_id, sequence, donated_by_id, donor_message)
    VALUES (new.id, v_city_id, v_gift.campaign_slug, v_gift.campaign_name, v_gift.organization_name, v_gift.cause, v_gift.amount, v_gift.charge_id, v_sequence, v_gift.donated_by_id, v_gift.donor_message);
    
    UPDATE public.gifted_donations SET claimed = true WHERE id = v_gift.id;
    
    v_sequence := v_sequence + 1;
    v_total_donated := v_total_donated + v_gift.amount;
  END LOOP;
  
  -- Update city stats if there were gifts
  IF v_sequence > 1 THEN
    SELECT COUNT(DISTINCT campaign_slug), COUNT(DISTINCT cause) INTO v_campaigns, v_causes
    FROM public.donations WHERE city_id = v_city_id;
    
    UPDATE public.cities SET total_donated = v_total_donated, campaigns_supported = v_campaigns, causes_supported = v_causes WHERE id = v_city_id;
  END IF;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
